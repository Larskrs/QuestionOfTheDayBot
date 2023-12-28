
import { setTimeout } from 'timers/promises'
import { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder, PermissionFlagsBits, UserSelectMenuBuilder } from 'discord.js';
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
        
        await interaction.reply ({content: "Loading available questions", ephemeral: false})
        const question   = await SelectQuestion(interaction)
        
        // await interaction.editReply({content: `You ordered a ${ticketType} ticket for the ${show}`, ephemeral: true })

        const channel = client.channels.cache.get("" + config.channels.questions);

        await channel.bulkDelete(100)
        
        
        const select = new UserSelectMenuBuilder()
        .setCustomId('question_answer')
        
        const row = new ActionRowBuilder()
        .addComponents(select)
        
        
        const message = await channel.send({
            embeds: [await QuestionEmbed(question)],
            components: [row],
        })

        // try {
        // 	const confirmation = await message.awaitMessageComponent({ time: 3_600_000 });

        //         // await confirmation.update({ content: `${confirmation.values?.[0]}`, ephemeral: true, components: [] });
        //         confirmation.
        //         console.log(confirmation)
        //         const answerData = await supabase
        //         .from("answers")
        //         .insert({
        //             question: question.id,
        //             data: confirmation.values?.[0],
        //             user: confirmation.user.id
        //         })
        //         .select("*")
        //         console.log(answerData)
            
        // } catch (e) {
        //     console.log(e)
        // 	await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', ephemeral: true, components: [] });
        // }
    //     await channel.send({
    //         content: `${question.question}`,
    //         components: [row],
    // });
        // await interaction.user.send({ embeds: [await QuestionEmbed(question, ticketType)]})

        await setTimeout(6000);
        // await interaction.deleteReply()
         
    }

    const questionData = await supabase
    .from("questions")
    .select("*")
    

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
                return question[0]
            
        } catch (e) {
            console.log(e)
        	await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', ephemeral: true, components: [] });
        }
}





