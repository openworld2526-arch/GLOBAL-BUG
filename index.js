/**
 * NEW YEAR BUG 2026 - Customized for OUSSAMA ZORO
 * Platform: Railway.app | Connection: Pairing Code
 */

const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    makeInMemoryStore, 
    jidDecode, 
    proto, 
    getContentType 
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const fs = require('fs');
const readline = require("readline");
const chalk = require("chalk");
const figlet = require("figlet");
const _ = require('lodash');

// --- إعدادات الهوية الخاصة بك (OUSSAMA ZORO) ---
global.owner = ['212679226276'] 
global.ownername = 'OUSSAMA ZORO'
global.botname = 'NEW YEAR BUG 2026'
// --------------------------------------------

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });

async function startBotz() {
    // إعداد الجلسة في مجلد session لضمان الاستمرارية على Railway
    const { state, saveCreds } = await useMultiFileAuthState('session');
    
    const bot = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, // تعطيل QR ليعمل بنظام Pairing Code
        auth: state,
        connectTimeoutMs: 60000,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // منطق طلب Pairing Code لرقمك (212679226276)
    if (!state.creds.registered) {
        const phoneNumber = "212679226276"; 

        setTimeout(async () => {
            let code = await bot.requestPairingCode(phoneNumber);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            console.log(chalk.black.bgGreen.bold(`\n>>> كود ربط ${global.botname} هو: ${code} <<<\n`));
            console.log(chalk.yellow(`مرحباً ${global.ownername}، افتح واتساب > الأجهزة المرتبطة > ربط برقم الهاتف وأدخل الكود.`));
        }, 5000);
    }

    // حفظ بيانات الجلسة تلقائياً
    bot.ev.on('creds.update', saveCreds);
    
    // مراقبة حالة الاتصال
    bot.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                console.log(chalk.red("انقطع الاتصال... جاري إعادة التشغيل تلقائياً"));
                startBotz();
            } else {
                console.log(chalk.red("تم تسجيل الخروج! يرجى حذف مجلد session وإعادة الربط."));
            }
        } else if (connection === 'open') {
            console.log(chalk.green.bold(`\n[+] تم الاتصال بنجاح!\n[+] البوت: ${global.botname}\n[+] المالك: ${global.ownername}\n`));
        }
    });

    // معالج الرسائل والأوامر
    bot.ev.on('messages.upsert', async chatUpdate => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;
            
            // التأكد من استدعاء ملف الأوامر الرئيسي (global.js)
            // ملاحظة: إذا كان اسم ملف الأوامر في مستودعك مختلفاً (مثل main.js) قم بتغييره هنا
            if (fs.existsSync('./global.js')) {
                require('./global')(bot, mek, chatUpdate, store);
            } else {
                console.log(chalk.yellow("تحذير: ملف global.js غير موجود لتنفيذ الأوامر."));
            }
        } catch (e) { 
            console.log(chalk.red("خطأ في معالجة الرسالة: "), e); 
        }
    });

    store.bind(bot.ev);
    return bot;
}

// تشغيل البوت
console.log(chalk.blue(figlet.textSync(global.botname, { horizontalLayout: 'default' })));
startBotz();
