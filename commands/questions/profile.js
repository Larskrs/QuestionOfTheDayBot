
import { setTimeout } from 'timers/promises'
import { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder, UserSelectMenuBuilder, TextInputBuilder, TextInputStyle, ModalBuilder, ChannelType, PermissionFlagsBits, AttachmentBuilder } from 'discord.js';
import { supabase } from '../../libs/database.js';
import config from "../../config.json" assert { type: 'json' }

const Canvas = await import('@napi-rs/canvas')

    export { data, execute }

    const data = new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Display your profile.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)

    
	const execute = async (interaction, client) => {
        // interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild

        const channel = interaction.channel

        const canvas = Canvas.createCanvas(2883, 939);
		const context = canvas.getContext('2d');

        const background = await Canvas.loadImage('./wallpaper.png');
        // size of image is 703x1309

        context.drawImage(background, 0, 0, canvas.width, canvas.height);

        const avatar = await Canvas.loadImage(interaction.user.displayAvatarURL({ extension: 'jpg' }));

        context.font = applyText(canvas, interaction.user.username);
        context.fillStyle = '#ffffff';
        context.fillText(interaction.user.username, canvas.width / 2.5, canvas.height / 1.8);
        

        // Pick up the pen
        context.beginPath();
        const imageRadius = 600
        const padding = 25
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
    
        interaction.reply({ files: [attachment] });
        
    }

    const applyText = (canvas, text) => {
        const context = canvas.getContext('2d');
    
        // Declare a base size of the font
        let fontSize = 240;
    
        do {
            // Assign the font to the context and decrement it so it can be measured again
            context.font = `${fontSize -= 10}px Arial, sans-serif`;
            // Compare pixel width of the text to the canvas minus the approximate avatar size
        } while (context.measureText(text).width > canvas.width - 300);
    
        // Return the result to use in the actual canvas
        return context.font;
    };

