# Deploy the backend on a FREE Indian server (Oracle Cloud Mumbai)

AnyROR blocks/throttles foreign data-center IPs, so the scraper must run from India.
The only genuinely free, permanent Indian-IP host is **Oracle Cloud "Always Free"**
(Mumbai `ap-mumbai-1` or Hyderabad `ap-hyderabad-1`): up to 4 ARM OCPUs + 24 GB RAM, free forever.

## Step 1 — You: create the account (~10 min, one time)

1. Go to https://signup.oraclecloud.com → pick **India** as country, **Mumbai** as home region.
2. Card verification is required (₹2 temporary hold, no charges on Always Free).
3. Once in the console: Compute → Instances → **Create instance**
   - Image: **Ubuntu 24.04**, Shape: **VM.Standard.A1.Flex** (4 OCPU / 24 GB — all free)
   - Networking: create new VCN with defaults, **assign a public IP**
   - Add your SSH key (or use the console's Cloud Shell later)
4. After creation, open the instance's **subnet → Security List → Add Ingress Rules**:
   allow TCP **80** and **443** from `0.0.0.0/0`.

## Step 2 — On the server: one paste (Cloud Shell or SSH)

```bash
# install docker + caddy (auto-HTTPS reverse proxy)
sudo apt-get update && sudo apt-get install -y docker.io caddy git
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT

# build & run the API
git clone https://github.com/chinmaydrive02-rgb/satyalekh.git
cd satyalekh/backend
sudo docker build -t satyalekh-api .
sudo docker run -d --name api --restart unless-stopped -p 127.0.0.1:8000:8000 \
  -e GOOGLE_API_KEY='<your-gemini-key>' \
  -e SUPABASE_URL='https://uvvwqugljoritqbjcryg.supabase.co' \
  -e SUPABASE_KEY='sb_publishable_Cv3AzDyBhpa1YUInu796MQ_v-0QHxOR' \
  -e FREE_TRIAL_CREDITS='2' \
  satyalekh-api

# HTTPS via nip.io (no domain needed): replace 1.2.3.4 with your public IP
PUBIP=$(curl -s ifconfig.me)
echo "api-${PUBIP//./-}.nip.io {
  reverse_proxy 127.0.0.1:8000
}" | sudo tee /etc/caddy/Caddyfile
sudo systemctl restart caddy
echo "API live at: https://api-${PUBIP//./-}.nip.io"
```

## Step 3 — Point the frontend at it

Vercel → satyalekh → Settings → Environment Variables → edit `NEXT_PUBLIC_API_URL`
to `https://api-<your-ip-with-dashes>.nip.io` → redeploy (or push any commit).

## Step 4 — Verify

`https://api-….nip.io/config` should return JSON, and a search on the site should
now reach AnyROR from an Indian IP. Keep the Render Singapore service as a fallback;
suspend the Oregon one.

Auto-updates: to pull new code later — `cd satyalekh && git pull && cd backend &&
sudo docker build -t satyalekh-api . && sudo docker rm -f api && (re-run the docker run command)`.

Tip: I (Claude) can drive Steps 2–4 for you through the Oracle **Cloud Shell** in your
browser next session — you only need to finish the signup.
