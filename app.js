const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const { Payload } =require("dialogflow-fulfillment");
const app = express();

const MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var randomstring = require("randomstring"); 
var user_name="";

app.post("/dialogflow", express.json(), (req, res) => {
    const agent = new WebhookClient({ 
		request: req, response: res 
    });
  async function identify_user(agent)
  {
    const num = agent.parameters.phonenumber; 
    const client = new MongoClient(url);
    await client.connect();
    const snap = await client.db("ChatBot").collection("userdetails").findOne({phonenumber: num});
    if(snap==null){
	    await agent.add("Your mobile number is not REGISTERED!!!");
    }
    else
    {
        user_name=snap.username;
      await agent.add("Welcome  "+user_name+"!!  \n Please enter your issue");
    }
  }
  async function report_issue(agent)
  {
    if (user_name == "") {
      await agent.add("Please get registered!");
       return;
     }
      const val=agent.parameters.issue; 
      var trouble_ticket=randomstring.generate(7);
      //Generating trouble ticket and storing it in Mongodb
      //Using random module
      MongoClient.connect(url, function (err, db) {
        if (err)
          throw err;
        var dbo = db.db("ChatBot");
        var u_name = user_name;
        var issue_val = val;
        var status = "pending";
        let ts = Date.now();
        let date_ob = new Date(ts);
        let date = date_ob.getDate();
        let month = date_ob.getMonth() + 1;
        let year = date_ob.getFullYear();
        var time_date = year + "-" + month + "-" + date;
        var myobj = { username: u_name, issue: issue_val, status: status, time_date: time_date, trouble_ticket: trouble_ticket };
        dbo.collection("issuedetails").insertOne(myobj, function (err, res) {
          if (err)
            throw err;
          db.close();
        });
      });
      agent.add(user_name+"\nThe issue reported is: " + val + "\nThe ticket number is: " + trouble_ticket);
  }
var intentMap = new Map();
intentMap.set("complaint",identify_user);
intentMap.set("complaint - custom",report_issue);
agent.handleRequest(intentMap);

});//Closing tag of app.post

app.listen(process.env.PORT || 2001);
