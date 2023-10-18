module.exports = {
    name: 'milim',
    aliases: [],
    permissions: [],
    description: "embeds",
    async execute(client, message,cmd,args,Discord){
        //var person = message.mentions.members.first();
        //message.channel.send(`${person.nickname}`);

        var ID = message.author.id;
        var target = message.guild.members.cache.get(ID);
        var milimRole = "925851063200936027";
        
        

        if (target.roles.cache.some(role => role.id === milimRole)){
        var milimArray = ["https://i.redd.it/s2754m4u81m51.jpg", 
        "https://cdn.discordapp.com/attachments/851937476049895454/925512775986450452/RDT_20211228_1717108429599099458490903.jpg",
        "https://cdn.discordapp.com/attachments/851937476049895454/925179307972784158/RDT_20211227_1912051092445932970943738.jpg",
        "https://cdn.discordapp.com/attachments/851937476049895454/924745897122856990/RDT_20211226_1428495696869529544678912.jpg",
        "https://cdn.discordapp.com/attachments/851937476049895454/924356859715026974/RDT_20211225_1242247410656066702842361.jpg",
        "https://cdn.discordapp.com/attachments/851937476049895454/924342629418795008/RDT_20211225_1147191940813362078967918.jpg",
        "https://cdn.discordapp.com/attachments/851937476049895454/924325889687306261/RDT_20211225_1040587189540317119890100.jpg",
        "https://cdn.discordapp.com/attachments/851937476049895454/923971563127189534/94397233_p0_master1200.webp",
        "https://cdn.discordapp.com/attachments/851937476049895454/920721279986839614/20211215_115441.jpg",
        "https://cdn.discordapp.com/attachments/851937476049895454/920481213779689492/uhdpaper.com-3581e-phone-4k.jpg",
        "https://cdn.discordapp.com/attachments/851937476049895454/919935748017385472/RDT_20211213_0756072265758617014700358.jpg",
        "https://cdn.discordapp.com/attachments/851937476049895454/919360327034998794/RDT_20211211_1749153113004068607384149.jpg",
        "https://cdn.discordapp.com/attachments/851937476049895454/918192648370683924/20211208_122638.jpg",
        "https://cdn.discordapp.com/attachments/851937476049895454/918192648152563722/20211208_122658.jpg",
        "https://cdn.discordapp.com/attachments/851937476049895454/918168340931960842/RDT_20211208_1051468280980635943824036.jpg",
        "https://cdn.discordapp.com/attachments/851937476049895454/917889880988737536/RDT_20211204_1200336670565599503209781.jpg",
        "https://cdn.discordapp.com/attachments/851937476049895454/917889339730587668/RDT_20211207_1044057308274815537584033.jpg",
        "https://cdn.discordapp.com/attachments/851937476049895454/917889339105624125/RDT_20211207_1409267274164977218634738.jpg",
        "https://cdn.discordapp.com/attachments/851937476049895454/916410507580293181/RDT_20211203_142800793761101363325597.jpg",
        "https://cdn.discordapp.com/attachments/851937476049895454/916023196149489694/RDT_20211202_1247505939968982765046139.jpg",
        "https://cdn.discordapp.com/attachments/851937476049895454/915794671521906749/RDT_20211120_1810531583924112306151052.jpg",
        "https://cdn.discordapp.com/attachments/851937476049895454/915794671182184448/20211122_180636.jpg",
        "https://cdn.discordapp.com/attachments/851937476049895454/915794670469124117/RDT_20211123_1824024083070747671996417.jpg",
        "https://cdn.discordapp.com/attachments/851937476049895454/915794669764501514/RDT_20211124_170658512025637742619103.jpg",
        "https://cdn.discordapp.com/attachments/851937476049895454/915794669164691456/RDT_20211127_0106596174986994354298769.jpg",
        "https://cdn.discordapp.com/attachments/851937476049895454/915794668845953064/RDT_20211127_0103024180594454118256982.jpg",
        "https://cdn.discordapp.com/attachments/851937476049895454/915794668283891712/RDT_20211127_2054052920308387527014718.jpg",
        "https://cdn.discordapp.com/attachments/851937476049895454/915794667415683082/RDT_20211127_2054423355524459909003453.jpg",
        "https://cdn.discordapp.com/attachments/851937476049895454/915794666752999464/RDT_20211127_2054558580073248815499802.jpg",
        "https://cdn.discordapp.com/attachments/851937476049895454/915794245351260170/RDT_20211201_2138471167351027840463337.jpg",
        "https://cdn.discordapp.com/attachments/851937476049895454/915667218816180224/RDT_20211201_131420634095728986822555.jpg",
        "https://cdn.discordapp.com/attachments/850894221816758272/905803222843818024/RDT_20211104_0858156993332505543180057.jpg",
        "https://cdn.discordapp.com/attachments/851937476049895454/926491478677663814/RDT_20211231_0935086865249099632951709.jpg",
        "https://media.discordapp.net/attachments/851937476049895454/930104707274395698/20220110_092303.jpg",
        "https://media.discordapp.net/attachments/851937476049895454/929874497979441262/87698365_p0_master1200.png?width=643&height=909",
        "https://media.discordapp.net/attachments/851937476049895454/929873676474679337/75923415_p0_master1200.png?width=598&height=910",
        "https://media.discordapp.net/attachments/851937476049895454/929871221359804446/91099858_p0_master1200.png",
        "https://media.discordapp.net/attachments/851937476049895454/929152304811212870/89977752_p0_master1200.png?width=725&height=910",
        "https://media.discordapp.net/attachments/851937476049895454/929152018814210078/90821464_p0_master1200.png?width=644&height=910",
        "https://media.discordapp.net/attachments/851937476049895454/929151862442176613/90857414_p0_master1200.png?width=682&height=910",
        "https://media.discordapp.net/attachments/851937476049895454/929151445608042537/90775189_p0_master1200.png?width=643&height=910",
        "https://media.discordapp.net/attachments/851937476049895454/929151311067373618/91654131_p0_master1200.png",
        "https://media.discordapp.net/attachments/851937476049895454/929149830629064755/93421242_p0_master1200.png?width=606&height=910",
        "https://media.discordapp.net/attachments/851937476049895454/929149773779435580/93656682_p0_master1200.png?width=647&height=910",
        "https://media.discordapp.net/attachments/851937476049895454/929152153350701066/90784458_p0_master1200.png?width=512&height=910",
        "https://media.discordapp.net/attachments/851937476049895454/929821138077507614/20220109_143632.jpg"
    ]

        var picture = milimArray[Math.floor(Math.random()*milimArray.length)];
        message.channel.send(picture);
    } else {
        message.reply("you can't run this command. <a:milimlaugh:928147732680548352>")
        /*
        message.channel.send("You are missing the special role for this command! <a:ratejam:925478347255996457> \nHave this embed instead");
        const newEmbed = new Discord.MessageEmbed()
        .setColor('#E76AA3')
        .setTitle("Arcade Tao")
        .setURL('https://discord.gg/ganyumains')
        .setDescription("Milim!!!!!!!!!")
        .setImage('https://i.redd.it/s2754m4u81m51.jpg')
        .addFields(
            {name: 'Rule 1', value: 'Be nice'},
            {name: 'Rule 2', value: 'Praise Milim :heart: '},
            {name: 'Rule 3', value: 'bully melody <:hehehe:850914083967729676>'}

        )
        
        .setFooter('MILIM');
        
        
        

        message.channel.send({ embeds: [newEmbed] });
        */
    }

        
        
        
        
        

        
    }

    
}
