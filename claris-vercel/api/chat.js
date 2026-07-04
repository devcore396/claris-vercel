// api/chat.js - Endpoint serverless para Vercel
// ==================================================
//  CLARIS - Backend en Vercel
// ==================================================

const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Handler para Vercel
module.exports = async (req, res) => {
    // Configurar CORS manualmente
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { message, history = [] } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Mensaje requerido' });
        }

        console.log('📨 Mensaje:', message);

        // Si no hay Groq API Key, modo offline
        if (!process.env.GROQ_API_KEY) {
            const respuestas = [
                '¡Excelente! ¿Te gustaría agendar una cita? 🦷',
                'Claro, puedo ayudarte. ¿Qué día prefieres? 📅',
                'Entendido. Nuestros especialistas están disponibles. 👨‍⚕️',
                'Gracias por tu consulta. ¿Necesitas más información? 😊'
            ];
            const respuesta = respuestas[Math.floor(Math.random() * respuestas.length)];
            return res.json({ texto: respuesta, fuente: 'offline' });
        }

        // Usar Groq
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                    { 
                        role: 'system', 
                        content: `Eres Claris, asistente dental. Responde de forma amable, breve y profesional. Usa emojis para hacer la conversación amigable. Máximo 3 párrafos.` 
                    },
                    ...history.slice(-8),
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 350
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || 'Error en Groq');
        }

        const texto = data.choices?.[0]?.message?.content || 'No pude procesar tu mensaje.';

        res.json({ texto, fuente: 'groq' });

    } catch (error) {
        console.error('Error en chat:', error);
        res.status(500).json({ 
            texto: '⚠️ Error al procesar tu mensaje. Intenta de nuevo.',
            error: error.message 
        });
    }
};