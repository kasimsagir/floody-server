const Constant = require('../../Utils/Constants');
userSchema = require('../../components/user/model/user_model');
serverSchema = require('../../components/server/model/server-model')
settingSchema=require('../../components/setting/model/setting-model');
serverSettingSchema=require('./model/server-setting-model')

module.exports = {
    getEvents,
    getSettings,
    addSettings,
    getSettingsAdmin
}


async function getEvents(req, res, next) {

    res.status(200).send(global.EVENTS)

}


async function getSettings(req, res, next) {
    var userId = res.userId;

    userSchema.findOne({_id: userId}).populate({
        path: 'settings',
        populate: {path: 'servers', select:['_id','name']}

    }).then(user => {
        serverSchema.find().then(async servers => {
            var withOutReferanceServer = JSON.parse(JSON.stringify(servers));

            await withOutReferanceServer.map(async server => {
                delete server['entries']
                await user.settings.servers.map(async settingServer => {
                    if (settingServer._id.toString() == server._id.toString()) {
                        server.isLiked = true;
                    }
                });
                if (server.isLiked == undefined) {
                    server.isLiked = false
                }
            });

            model = {isSuccess: true, statusCode: 200}
            model.settings = withOutReferanceServer
            res.status(200).send(model)

        }).catch(next)
    }).catch(next)

}

async function addSettings(req, res, next) {
    var userId = res.userId;

    await userSchema.findOne({_id: userId}).then( async user => {
        if(user.settings == null){
            var setting=new settingSchema({
                user:user._id
            });
            await setting.save();
            user.settings=setting;
            await user.save();
        }

        var settingId=user.settings._id.toString();

        await settingSchema.findOne({_id: settingId}).then(async setting => {
            setting.servers =[];
            setting.servers = req.body.settings
            setting.save()

            res.status(200).send({
                code:200,
                message:"OK"
            })
        })

    }).catch(next)

}

async function getSettingsAdmin(req,res,next) {
    if(req.method=="GET"){
        serverSettingSchema.find().then(settings=>{
            res.render('settings',{
                setting:settings
            })

        }).catch(next)
    }else{
        var isConfirm=req.body.confirmStatus
        serverSettingSchema.find().then(setting=>{
            if(isConfirm =="OPEN"){
                  setting[0].isOpenAutoConfirm=true
                  
            }else{
                setting[0].isOpenAutoConfirm=false

            }

            setting[0].save()
                  res.redirect('/admin/settings')  
        }).catch(next)
        
    }

}