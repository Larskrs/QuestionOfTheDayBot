
import { setTimeout } from 'timers/promises'
import { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder, PermissionFlagsBits, UserSelectMenuBuilder, ComponentType } from 'discord.js';
import { supabase } from '../../libs/database.js';
import config from "../../config.json" assert { type: 'json' }

    export { data, execute }

    const data = new SlashCommandBuilder()
        .setName('start')
        .setDescription('Select a question and start it for today.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)

    
	const execute = async (interaction, client) => {
        // interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
        
        const guildId = interaction.guildId
        let guild = await client.guilds.cache.get(guildId)


        await interaction.reply ({content: "Loading available questions", ephemeral: false})
        questionData = await supabase
            .from("questions")
            .select("*")

        const question   = await SelectQuestion(interaction)
        
        // await interaction.editReply({content: `You ordered a ${ticketType} ticket for the ${show}`, ephemeral: true })

        const channel = client.channels.cache.get("" + config.channels.questions);
        const answerChannel = client.channels.cache.get("" + config.channels.answers);

        await channel.bulkDelete(100)
        
        const select = new UserSelectMenuBuilder()
        .setCustomId('question_answer')
        
        const row = new ActionRowBuilder()
        .addComponents(select)
        
        
        const message = await channel.send({
            embeds: [await QuestionEmbed(question)],
            components: [row],
        })
        await channel.send({
            content: `New Question TODAY! <@&${config.roles.qotd_ping}>`
        })
        await answerChannel.send({
            content: `
        These answers are from a previous QOTD. \n New questions will be posted in <#${config.channels.questions}>
            `
        })

        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.UserSelect,
            // filter: (i) => i.customId === message.id, 

        })

        const session = await supabase
        .from("question_session")
        .insert({
            question: question.id,
        })
        .select("*")
        .single()
        console.log(session)

        collector.on('collect', async i => {
            // if (i.user.id === interaction.user.id) {
            
                const user   = await guild.members.fetch(i.user.id)
                const target = await guild.members.fetch(i.values[0]);

                const userName  = GetName(user)

                const answer = await supabase
                .from("answers")
                .upsert([
                    {
                      "session": session.data.id,
                      "data": i.values?.[0],
                      "user": i.user.id
                    }
                  ], { onConflict: ['session', 'user'] })

                  .select(`*`)

                if (answer.statusText === "OK") {   
                    await i.reply({content: `<@${user.user.id}>, your answer has been updated in: <#${answerChannel.id}> :smile:`})
                } else if (answer.statusText === "Created") {
                    await channel.send({
                        embeds: [await AnswerEmbed(question.format, target, user, answer.count)],
                    })
                    await i.reply({content: `<@${user.user.id}>, your answer has been submitted in: <#${answerChannel.id}> :thumbsup:`})
                } else {
                    await i.reply({content: `<@${user.user.id}>, there was an error creating your answer... Please contact staff!`})
                }
                await setTimeout(3000);
                await i.deleteReply()
        });
        
        collector.on('end', collected => {
            console.log(`Collected ${collected.size} interactions.`);
        });

        
    }

    let questionData = await supabase
    .from("questions")
    .select("*")
    

function GetAvatarUrl(member) {
    return "https://cdn.discordapp.com/avatars/"+member.user.id+"/"+member.avatar+".jpeg"
}
function GetName(member) {
    if (member.nickname) { return member.nickname }
    if (member.user.globalName) { return member.user.globalName }
    return member.user.username 
}

async function AnswerEmbed (format, target, user) {
    const targetName = GetName(target)
    const userName  = GetName(user)
    // const userName = user.member.nickname ? user.member.nickname : user.globalName
    const embed = new EmbedBuilder()
    .setColor(config.embed.color)
	.setAuthor({ name: `${userName} has answered.`, iconURL: user.displayAvatarURL() })


    return embed

}

async function QuestionEmbed (question) {
    
    // inside a command, event listener, etc.
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

async function SelectQuestion (interaction) {

    const select = new StringSelectMenuBuilder()
        .setCustomId('question_select')
        .setPlaceholder('What question to show today.')
        .setOptions(
            questionData.data.map((d,i) => ({
                    
                    label: d.title,
                    value: "question_" + d.id,
                    description: d.question ? d.question : "No question data in question!"

                }))
        );

        const row = new ActionRowBuilder()
			.addComponents(select);

        const response = await interaction.editReply({
			content: 'What question should we show today?',
			components: [row],
		});

        try {
        	const confirmation = await response.awaitMessageComponent({ time: 3_600_000 });

                await confirmation.update({ content: `${confirmation.values?.[0]}`, ephemeral: true, components: [] });
                const id = confirmation.values?.[0]
                const question_id = id.split("question_")[1]

                const question = questionData.data.filter((q) => q.id+"" === question_id)
                        // Clean the chat
                await interaction.deleteReply()
                return question[0]
            
        } catch (e) {
            console.log(e)
        	await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', ephemeral: true, components: [] });
        }
}





