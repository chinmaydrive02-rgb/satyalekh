export const mockData: any = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "1",
        "survey_number": "25",
        "village_name": "Shela",
        "owner_name": "Rajesh Patel",
        "tenure_type": "Old Tenure",
        "is_litigated": false,
        "zone_type": "R1",
        "road_width": 24.0,
        "type": "plot",
        "risk_color": "#4edea3"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [72.4910, 23.0330],
            [72.4925, 23.0330],
            [72.4925, 23.0345],
            [72.4910, 23.0345],
            [72.4910, 23.0330]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "2",
        "survey_number": "26",
        "village_name": "Shela",
        "owner_name": "Amit Shah",
        "tenure_type": "New Tenure",
        "is_litigated": false,
        "zone_type": "Agriculture",
        "road_width": 12.0,
        "type": "plot",
        "risk_color": "#ffdad7"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [72.4926, 23.0330],
            [72.4940, 23.0330],
            [72.4940, 23.0345],
            [72.4926, 23.0345],
            [72.4926, 23.0330]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "3",
        "survey_number": "27",
        "village_name": "Shela",
        "owner_name": "Sunbuilders Corp",
        "tenure_type": "Old Tenure",
        "is_litigated": true,
        "zone_type": "R1",
        "road_width": 18.0,
        "type": "plot",
        "risk_color": "#ba1b24"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [72.4910, 23.0346],
            [72.4925, 23.0346],
            [72.4925, 23.0360],
            [72.4910, 23.0360],
            [72.4910, 23.0346]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "4",
        "survey_number": "28",
        "village_name": "Shela",
        "owner_name": "Gita Desai",
        "tenure_type": "Govt Land",
        "is_litigated": false,
        "zone_type": "R2",
        "road_width": 9.0,
        "type": "plot",
        "risk_color": "#ffdad7"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [72.4926, 23.0346],
            [72.4940, 23.0346],
            [72.4940, 23.0360],
            [72.4926, 23.0360],
            [72.4926, 23.0346]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "5",
        "survey_number": "29",
        "village_name": "Shela",
        "owner_name": "Hitesh Bhai",
        "tenure_type": "Old Tenure",
        "is_litigated": false,
        "zone_type": "R2",
        "road_width": 12.0,
        "type": "plot",
        "risk_color": "#4edea3"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [72.4895, 23.0330],
            [72.4909, 23.0330],
            [72.4909, 23.0345],
            [72.4895, 23.0345],
            [72.4895, 23.0330]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "heritage_1",
        "name": "ASI Heritage Zone - NMA NOC Required",
        "type": "heritage_zone"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [72.5000, 22.9960]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "pipeline_1",
        "name": "High Pressure Line - 15m Buffer",
        "type": "pipeline"
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [72.4850, 23.0200],
          [72.4950, 23.0400],
          [72.5050, 23.0500]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "metro_1",
        "name": "Vibration Impact Zone",
        "type": "metro"
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [72.4800, 23.0350],
          [72.4900, 23.0300],
          [72.5000, 23.0350]
        ]
      }
    }
  ]
};
