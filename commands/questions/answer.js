
import { setTimeout } from 'timers/promises'
import { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder, UserSelectMenuBuilder, TextInputBuilder, TextInputStyle, ModalBuilder } from 'discord.js';
import { supabase } from '../../libs/database.js';

    export { data, execute }

    const data = new SlashCommandBuilder()
        .setName('answer')
        .setDescription('Helps you order tickets.')

    
	const execute = async (interaction, client) => {
        // interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
        
        const selectMenu = new UserSelectMenuBuilder({
            custom_id: 'a cool select menu',
            placeholder: 'select an option',
            max_values: 2,
        });

        const modal = new ModalBuilder()
        .setCustomId('answer_modal')
        .setTitle('Answer Question')
        .setComponents(
            new ActionRowBuilder()
            .setComponents(
                new TextInputBuilder()
                .setCustomId('answerText')
                .setLabel("What is your favorite animal?")
                .setMinLength(2)
                .setMaxLength(16)
                .setRequired(true)
                .setStyle(TextInputStyle.Paragraph)
                    ,
                selectMenu
            ),
            
        )
        interaction.showModal(modal)
        const modalSubmitInteraction = await interaction.awaitModalSubmit({ filter: (i) => {
            console.log('Await Modal Submit')
        }, time: 10_000})

        ModalSubmitInteraction.reply({ content: `Thank you for answering ${interaction.user.username}`})

        
        
    }

