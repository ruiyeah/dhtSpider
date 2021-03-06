const fs=require("fs");
const redis = require("./database/redis");
const moment = require("moment");
let client = redis.client;
const getAsync = redis.getAsync;

if (!fs.existsSync(process.cwd() + '/log/')) {
    console.log("Creating backup directory.");
    fs.mkdirSync(process.cwd() + '/log/');
}
let logCount=function(values){
    client.set('currentCounts',JSON.stringify(values));
    let str=moment().format('YYYY/MM/DD hh:mm:ss')+'  index:'+values[0]+' torrents:'+values[1]+'\n';
    fs.writeFile(process.cwd() + '/log/count.log',str,{flag:'a'},function(err){
        if(err){
            console.log(err);
        }
    })
};
let logSearch=async function(){
    let targets=await getAsync('targets');
    let arr=JSON.parse(targets);
    let tmpArr=[];
    for(let item of arr){
        tmpArr.push(JSON.stringify(item));
    }
    let str=tmpArr.join('\n');
    fs.writeFile(process.cwd() + '/log/target.log',str,{flag:'a'},function(err){
        if(err){
            console.log(err);
        }else {
            client.set('targets',JSON.stringify([]));
        }
    })
};



module.exports={
    logCount,
    logSearch
};