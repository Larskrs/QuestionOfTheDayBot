
import { setTimeout } from 'timers/promises'
import { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder, UserSelectMenuBuilder, TextInputBuilder, TextInputStyle, ModalBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import { supabase } from '../../libs/database.js';
import config from "../../config.json" assert { type: 'json' }

    export { data, execute }

    const data = new SlashCommandBuilder()
        .setName('sneak')
        .setDescription('Say message in main chat.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
        .addChannelOption(Option => Option
            .setRequired(true)
            .setDescription("What Channel to attack?")
            .setName("channel")
        )
        .addStringOption(Option => Option
            .setRequired(true)
            .setDescription("What do you want to say?")
            .setName("message")
        )
    
	const execute = async (interaction, client) => {
        // interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
        
        let channelId = interaction.options.getChannel('channel')
        let text = interaction.options.getString('message');

        const channel = client.channels.cache.get("" + channelId);
        channel.send(text);

        interaction.reply(`Your message has been sent in ${channel.name}`)
        
    }

