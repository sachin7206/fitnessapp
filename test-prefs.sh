#!/bin/bash
# First login to get a JWT token
LOGIN=$(curl -s -X POST http://localhost:8081/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"sachin@gmail.com","password":"Test@1234"}')
echo "LOGIN RESPONSE:" > /Users/sbisht/Documents/fitnessapp/logs/pref-debug.txt
echo "$LOGIN" >> /Users/sbisht/Documents/fitnessapp/logs/pref-debug.txt

# Extract token
TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('accessToken',''))" 2>/dev/null)
echo "" >> /Users/sbisht/Documents/fitnessapp/logs/pref-debug.txt
echo "TOKEN: ${TOKEN:0:30}..." >> /Users/sbisht/Documents/fitnessapp/logs/pref-debug.txt

if [ -z "$TOKEN" ]; then
  echo "NO TOKEN FOUND, trying alternate parse" >> /Users/sbisht/Documents/fitnessapp/logs/pref-debug.txt
  TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('accessToken',''))" 2>/dev/null)
  echo "TOKEN2: ${TOKEN:0:30}..." >> /Users/sbisht/Documents/fitnessapp/logs/pref-debug.txt
fi

# Save food preferences
echo "" >> /Users/sbisht/Documents/fitnessapp/logs/pref-debug.txt
echo "=== SAVE FOOD PREFERENCES ===" >> /Users/sbisht/Documents/fitnessapp/logs/pref-debug.txt
SAVE=$(curl -s -w '\nHTTP_CODE:%{http_code}' -X POST http://localhost:8082/nutrition/food-preferences \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "includeChicken": true,
    "includeFish": true,
    "includeRedMeat": false,
    "eggsPerDay": 5,
    "includeRice": true,
    "includeRoti": false,
    "includeDal": false,
    "includeMilk": false,
    "includePaneer": false,
    "includeCurd": true,
    "cookingOilPreference": "GHEE",
    "preferHomemade": true,
    "allergies": [],
    "dislikedFoods": [],
    "region": "NORTH",
    "customMeals": [{"name":"Breakfast","type":"BREAKFAST","time":"8:00 AM","enabled":true}],
    "includePreWorkout": true,
    "preWorkoutTime": "5:00 PM",
    "includePostWorkout": false,
    "postWorkoutTime": "7:00 PM",
    "canTakeWheyProtein": true,
    "supplements": ["CREATINE"]
  }')
echo "$SAVE" >> /Users/sbisht/Documents/fitnessapp/logs/pref-debug.txt

# Get food preferences back
echo "" >> /Users/sbisht/Documents/fitnessapp/logs/pref-debug.txt
echo "=== GET FOOD PREFERENCES ===" >> /Users/sbisht/Documents/fitnessapp/logs/pref-debug.txt
GET=$(curl -s -w '\nHTTP_CODE:%{http_code}' -X GET http://localhost:8082/nutrition/food-preferences \
  -H "Authorization: Bearer $TOKEN")
echo "$GET" >> /Users/sbisht/Documents/fitnessapp/logs/pref-debug.txt

# Also test through gateway
echo "" >> /Users/sbisht/Documents/fitnessapp/logs/pref-debug.txt
echo "=== GET VIA GATEWAY ===" >> /Users/sbisht/Documents/fitnessapp/logs/pref-debug.txt
GW=$(curl -s -w '\nHTTP_CODE:%{http_code}' -X GET http://localhost:8080/api/nutrition/food-preferences \
  -H "Authorization: Bearer $TOKEN")
echo "$GW" >> /Users/sbisht/Documents/fitnessapp/logs/pref-debug.txt

echo "DONE"

