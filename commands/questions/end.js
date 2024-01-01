
import { setTimeout } from 'timers/promises'
import { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder, PermissionFlagsBits, UserSelectMenuBuilder, ComponentType } from 'discord.js';
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





