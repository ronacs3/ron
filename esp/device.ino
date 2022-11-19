#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <DHT.h>
#include <BH1750.h>

BH1750 lightMeter;
#define DHTTYPE DHT11
#define DHTPIN 4
#define ledPin 2
// Replace the next variables with your SSID/Password combination
const char* ssid = "T";
const char* password = "12345678";

// Add your MQTT Broker IP address, example:
//const char* mqtt_server = "192.168.1.144";
const char* mqtt_server = "172.20.10.14";

WiFiClient espClient;
PubSubClient client(espClient);
long lastMsg = 0;
char msg[50];
int value = 0;

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  Wire.begin();
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);

  dht.begin();
  lightMeter.begin();
  pinMode(ledPin,OUTPUT);
}

void setup_wifi() {
  delay(1000);
  // We start by connecting to a WiFi network
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void callback(char* topic, byte* message, unsigned int length) {
  Serial.print("Message arrived on topic: ");
  Serial.print(topic);
  Serial.print(". Message: ");
  String messageTemp;
  
  for (int i = 0; i < length; i++) {
    Serial.print((char)message[i]);
    messageTemp += (char)message[i];
  }
  Serial.println();

  // Feel free to add more if statements to control more GPIOs with MQTT

  // If a message is received on the topic esp32/output, you check if the message is either "on" or "off". 
  // Changes the output state according to the message
  if (String(topic) == "button") {
    Serial.print("Changing output to ");
    if(messageTemp == "on"){
      Serial.println("on");
      digitalWrite(ledPin, LOW);
    }
    else if(messageTemp == "off"){
      Serial.println("off");
      digitalWrite(ledPin, HIGH);
    }
  }
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect("ESP32Client")) {
      Serial.println("connected_ESP32client_");
      // Subscribe
      client.subscribe("button");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}
int temp = 0;  
int hum = 0; 
int lux = 0;
void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  long now = millis();
  if (now - lastMsg > 5000) {
    lastMsg = now;
   
    temp = dht.readTemperature();  
    hum = dht.readHumidity(); 
    lux = lightMeter.readLightLevel();

    // Temperature
//    Serial.print("Temperature: ");
//    Serial.println(temp);
    char nhietdo[50];
    sprintf(nhietdo, "%d", temp);
    client.publish("esp32/temp", nhietdo);
    
    // Humidity
    
//    Serial.print("Humidity: ");
//    Serial.println(hum);
    char doam[50];
    sprintf(doam, "%d", hum);
    client.publish("esp32/humi", doam);

     // Lux
//    Serial.print("Light: ");
//    Serial.println(lux);
    char anhsang[50];
    sprintf(anhsang, "%d", lux);
    client.publish("esp32/lux", anhsang);
    
    //  pub du lieu
    char dulieu[100];
    sprintf(dulieu, "{\"nhietdo\":\"%d\",\"doam\":\"%d\",\"anhsang\":\"%d\"}", temp,hum,lux);
    client.publish("esp32/dulieu", dulieu);
  }
}
