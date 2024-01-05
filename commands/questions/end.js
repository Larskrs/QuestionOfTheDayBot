
import { setTimeout } from 'timers/promises'
import { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder, PermissionFlagsBits, UserSelectMenuBuilder, ComponentType, AttachmentBuilder } from 'discord.js';
import { supabase } from '../../libs/database.js';
import config from "../../config.json" assert { type: 'json' }

    export { data, execute }

    const data = new SlashCommandBuilder()
        .setName('end')
        .setDescription('Ends a session')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
    
	const execute = async (interaction, client) => {
        // interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
        
        const guildId = interaction.guildId
        let guild = await client.guilds.cache.get(guildId)


        await interaction.reply ({content: "Loading sessions...", ephemeral: false})
        sessions = await supabase
            .from("question_session")
            .select(`
                *,
                questions(*)
            `)
            .order("created_at", { ascending: false})
            .limit(10)

        const session   = await SelectSession(interaction)
        // await interaction.editReply({content: `You ordered a ${ticketType} ticket for the ${show}`, ephemeral: true })

        const channel = client.channels.cache.get("" + config.channels.questions);
        const answerChannel = client.channels.cache.get("" + config.channels.answers);

        await answerChannel.bulkDelete(100)
        await channel.bulkDelete(100)

        await answerChannel.send({
            embeds: [await QuestionEmbed(session.questions)],
        })

        await channel.send({
            content: `The question of the day is closed for now, you can see previous answers here: <#${config.channels.answers}>`
        })

        const answers = await supabase
        .from("answers")
        .select("*")
        .eq("session", session.id)    

        const answerCounts = await GetMostAnswered(answers.data)
        console.log({answerCounts})

        const target = await guild.members.fetch(answerCounts[0].data)
        const Name = await GetName(target)

        answerChannel.send({
            embeds: [await TopAnswer(answerCounts[0])],
        })
        answerChannel.send({
            files: [await createThumbnail(target.user.displayAvatarURL({ extension: 'jpg' }), Name)]
        })


        answers.data.map(async (answer) => {

            console.log("|--------------------------------|")
            console.log(answer)
            
            const user   = await guild.members.fetch(answer.user)
            const target = await guild.members.fetch(answer.data)

            // console.log(user, target)
            if (!user) { return; }
            if (!target) { return; }


            await answerChannel.send({
                embeds: [await AnswerEmbed(session.questions.format, target, user)],
            })
        })
         
    }

    let sessions= null

    async function TopAnswer (answer) {
        
        const embed = new EmbedBuilder()
        
        .setColor(config.embed.color)
        .setTitle("Top Answer!")
        .setAuthor({ name: 'Question of the Day', iconURL: 'http://aktuelt.tv/api/v1/files?fileId=49deaf2b-0912-4469-bf2e-89e3c7f72157.png' })
        
        // .setImage(await createThumbnail(target.user.displayAvatarURL({ extension: 'jpg' }), Name))
    
        return embed
    }

    async function GetMostAnswered (answers) {
        const valuesArray = answers.map(obj => obj["data"]);

        // Step 2: Count occurrences of each unique value
        const dataCounts = valuesArray.reduce((acc, value) => {
          acc[value] = (acc[value] || 0) + 1;
          return acc;
        }, {});
    
        // Step 3: Convert counts into an array of objects
        const resultArray = Object.entries(dataCounts).map(([data, count]) => ({ data, count }));
        resultArray.sort((a, b) => b.count - a.count);
    
        return resultArray;
    }
    
async function QuestionEmbed (question) {
    
        // inside a command, event listener, etc.v
        const embed = new EmbedBuilder()
        
        .setColor(config.embed.color)
        .setTitle(question.title)
        .setAuthor({ name: 'Question of the Day', iconURL: 'http://aktuelt.tv/api/v1/files?fileId=49deaf2b-0912-4469-bf2e-89e3c7f72157.png' })
        .setDescription(`
            ${question.lore}
        `)
        .setThumbnail('http://aktuelt.tv/api/v1/files?fileId=49deaf2b-0912-4469-bf2e-89e3c7f72157.png')
        .addFields(
            { name: '\u200B', value: '\u200B' },
            { name: 'Question', value: question.question, inline: true },
        )
        .setTimestamp()
        .setFooter({ text: 'Simply use the buttons below', iconURL: 'http://aktuelt.tv/api/v1/files?fileId=49deaf2b-0912-4469-bf2e-89e3c7f72157.png' });
    
        return embed
    
    }

function GetName(member) {
    if (member.nickname) { return member.nickname }
    if (member.user.globalName) { return member.user.globalName }
    return member.user.username 
}

async function AnswerEmbed (format, target, user) {
    console.log("Designing answer embed")
    const targetName = GetName(target)
    const userName  = GetName(user)
    // const userName = user.member.nickname ? user.member.nickname : user.globalName
    const embed = new EmbedBuilder()
    .setColor(config.embed.color)
	.setAuthor({ name: userName, iconURL: user.displayAvatarURL() })
    .setThumbnail(target.displayAvatarURL())
	.setDescription(`
        ${
            format
            .replaceAll('%answer%', targetName)
            .replaceAll('%user%', userName)
        }
        `)
    .addFields(
        { name: 'Answer', value: `<@${user.user.id}> answered: **${targetName}**`,  },
    )

    return embed

}

async function SelectSession (interaction) {

    const select = new StringSelectMenuBuilder()
        .setCustomId('session_select')
        .setPlaceholder('What session are you ending?')
        .setOptions(
            sessions.data.map((s,i) => ({
                    label: s.questions.title,
                    value: "session_" + s.id,
                    description: s.questions.question ? s.questions.question : "No question data in question!"
                }))
        );

        const row = new ActionRowBuilder()
			.addComponents(select);

        const response = await interaction.editReply({
			content: 'What session are you ending?',
			components: [row],
		});

        try {
        	const confirmation = await response.awaitMessageComponent({ time: 3_600_000 });

                await confirmation.update({ content: `${confirmation.values?.[0]}`, ephemeral: true, components: [] });
                const id = confirmation.values?.[0]
                console.log(id)
                const session_id = id.split("session_")[1]

                const selected_sessions = sessions.data.filter((q) => q.id+"" === session_id)
                return selected_sessions[0]
            
        } catch (e) {
            console.log(e)
        	await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', ephemeral: true, components: [] });
        }
}

const Canvas = await import('@napi-rs/canvas')

async function createThumbnail (Avatar, Name) {
    const canvas = Canvas.createCanvas(2883, 939);
    const context = canvas.getContext('2d');

    const background = await Canvas.loadImage('./wallpaper.png');
    // size of image is 703x1309

    context.drawImage(background, 0, 0, canvas.width, canvas.height);

    const avatar = await Canvas.loadImage(Avatar);

    context.font = applyText(canvas, Name);
    context.fillStyle = '#ffffff';
    context.fillText(Name, canvas.width / 2.5, canvas.height / 1.8);
    

    // Pick up the pen
    context.beginPath();
    const imageRadius = 600
    const padding = 64
    // Start the arc to form a circle
    context.arc(
        (imageRadius/2)+padding,
        canvas.height/2,
        imageRadius/2,
        0, Math.PI * 2,
        true
    );
    
    // Put the pen down
    context.closePath();
    
    // Clip off the region you drew on
    context.clip();
    context.drawImage(
        avatar,
        padding,                          // POS X
        canvas.height/2 - imageRadius/2,// POS Y
        imageRadius,
        imageRadius
    );


    // Use the helpful Attachment class structure to process the file for you
    const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'profile-image.png' });
    return attachment
}

const applyText = (canvas, text) => {
    const context = canvas.getContext('2d');

    // Declare a base size of the font
    let fontSize = 200;

    do {
        // Assign the font to the context and decrement it so it can be measured again
        context.font = `${fontSize -= 10}px Arial, sans-serif`;
        // Compare pixel width of the text to the canvas minus the approximate avatar size
    } while (context.measureText(text).width > canvas.width - 200);

    // Return the result to use in the actual canvas
    return context.font;
};





