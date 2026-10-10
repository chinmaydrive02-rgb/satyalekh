"""Record-first initialization and actual JavaScript readiness semantics, offline."""
import asyncio
import json
import shutil
import subprocess
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
import scraper


@pytest.mark.parametrize('kind', list(scraper.RECORD_TYPE_MAP))
def test_each_supported_type_is_selected_before_locations(monkeypatch, kind):
    events = []
    async def ready(page, selector, **kwargs):
        events.append(('ready', selector))
        return True
    async def select(page, el, selector, value, child, **kwargs):
        events.append(('select', value, child, kwargs['accept_postback']))
        return True
    monkeypatch.setattr(scraper, '_wait_for_dropdown_options', ready)
    monkeypatch.setattr(scraper, '_select_and_wait_for_child', select)
    page = SimpleNamespace(locator=lambda selector: selector)
    assert asyncio.run(scraper._initialize_record_form(page, kind))
    assert events == [('ready', scraper.ELEMENTS['record_type']),
                      ('select', scraper.RECORD_TYPE_MAP[kind], scraper.ELEMENTS['district'], True)]


def test_missing_type_control_never_selects(monkeypatch):
    monkeypatch.setattr(scraper, '_wait_for_dropdown_options', AsyncMock(return_value=False))
    select = AsyncMock()
    monkeypatch.setattr(scraper, '_select_and_wait_for_child', select)
    assert not asyncio.run(scraper._initialize_record_form(SimpleNamespace()))
    select.assert_not_called()


def test_real_predicate_waits_for_postback_even_with_unchanged_districts():
    node = shutil.which('node')
    if not node:
        pytest.skip('Node required for offline JavaScript predicate test')
    captured = {}
    class Page:
        url = 'https://anyror.gujarat.gov.in/LandRecordRural.aspx'
        async def evaluate(self, script, args):
            captured['setup' if isinstance(args, dict) else 'cleanup'] = script
            if isinstance(args, dict): captured['args'] = args
        async def wait_for_function(self, script, **kwargs):
            captured['predicate'] = script
    asyncio.run(scraper._select_and_wait_for_child(
        Page(), SimpleNamespace(select_option=AsyncMock()), '#type', '1', '#district', accept_postback=True))
    script = r'''
const fs=require('fs'), assert=require('assert/strict');
const c=JSON.parse(fs.readFileSync(0,'utf8'));
global.window=global;
let end, busy=false, removed=false;
const manager={add_endRequest: fn=>end=fn, remove_endRequest: fn=>{assert.equal(fn,end);removed=true},get_isInAsyncPostBack:()=>busy};
global.Sys={WebForms:{PageRequestManager:{getInstance:()=>manager}}};
const parent={value:'0'},child={disabled:false,options:[{},{}]};
global.document={documentElement:{},querySelector:s=>s==='#type'?parent:child};
global.MutationObserver=class {observe(){} disconnect(){}};
eval('('+c.setup+')')(c.args);
const ready=eval('('+c.predicate+')');
assert.equal(!!ready(c.args),false);
parent.value='1'; // select event alone is not a completed postback
assert.equal(!!ready(c.args),false);
busy=true;end();assert.equal(!!ready(c.args),false);
busy=false;assert.equal(!!ready(c.args),true);
child.disabled=true;assert.equal(!!ready(c.args),false);child.disabled=false;
// Ordinary location cascades still require their own child update.
assert.equal(!!ready({...c.args,acceptPostback:false}),false);
eval('('+c.cleanup+')')(c.args.marker);assert.equal(removed,true);
// A full document replacement removes the marker and retains selected type.
assert.equal(!!ready(c.args),true);
parent.value='0';assert.equal(!!ready(c.args),false);
'''
    subprocess.run([node, '-e', script], input=json.dumps(captured), text=True, check=True, capture_output=True)


@pytest.mark.parametrize('kind', ['VF6','VF8A','OWNER_NAME','VF7'])
def test_missing_search_control_never_reaches_captcha(monkeypatch, kind):
    events=[]
    class Missing:
        async def count(self): return 0
    class Page:
        url='https://anyror.gujarat.gov.in/LandRecordRural.aspx'
        async def goto(self,*args,**kwargs):
            assert kwargs['timeout']==20000
            events.append('navigate')
            return SimpleNamespace(status=200)
        def locator(self, selector):
            assert selector not in (scraper.ELEMENTS['captcha_img'],scraper.ELEMENTS['submit_btn'])
            return Missing()
    class Context:
        async def new_page(self): return Page()
        async def close(self): events.append('context-close')
    class Browser:
        async def new_context(self, **kwargs):
            assert 'user_agent' not in kwargs
            return Context()
        async def close(self): events.append('browser-close')
    class Playwright:
        async def __aenter__(self): self.chromium=self;return self
        async def __aexit__(self,*args): pass
        async def launch(self, **kwargs): return Browser()
    monkeypatch.setattr(scraper,'async_playwright',Playwright)
    monkeypatch.setattr(scraper,'_initialize_record_form',AsyncMock(return_value=True))
    monkeypatch.setattr(scraper,'_select_cascading_option',AsyncMock(return_value=True))
    result=asyncio.run(scraper._scrape_anyror_data('A','B','C','1',record_type=kind))
    assert result['code']=='PORTAL_UNAVAILABLE'
    assert 'No lookup was submitted' in result['error']
    assert 'context-close' in events and 'browser-close' in events
