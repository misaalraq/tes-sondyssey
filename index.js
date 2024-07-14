const readline = require('readline');
const {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  Keypair,
} = require('@solana/web3.js');
const bip39 = require('bip39');
const { derivePath } = require('ed25519-hd-key');
const bs58 = require('bs58');
require('dotenv').config();
const axios = require('axios');

const DEVNET_URL = 'https://devnet.sonic.game/';
const connection = new Connection(DEVNET_URL, 'confirmed');
const keypairs = [];

// Proxy list for each account
const proxies = ['proxy1.example.com:8000', 'proxy2.example.com:8000', 'proxy3.example.com:8000'];

async function sendSol(fromKeypair, toPublicKey, amount, proxy) {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromKeypair.publicKey,
      toPubkey: toPublicKey,
      lamports: amount, // Updated to directly use lamports amount
    })
  );

  try {
    // Send transaction using axios with proxy agent
    const signature = await sendAndConfirmTransaction(connection, transaction, [fromKeypair], {
      commitment: 'confirmed',
      preflightCommitment: 'confirmed',
      skipPreflight: false,
      preflightCommitment: 'max',
      commitment: 'max',
      preflightCommitment: 'confirmed',
      agent: {
        http: new require('http').Agent({ proxy: `http://${proxy}` }),
        https: new require('https').Agent({ proxy: `http://${proxy}` })
      }
    });
    return signature;
  } catch (error) {
    console.error('Failed to send SOL:', error);
    return null;
  }
}

function generateRandomAddresses(count) {
  const addresses = [];
  for (let i = 0; i < count; i++) {
    const keypair = Keypair.generate();
    addresses.push(keypair.publicKey.toString());
  }
  return addresses;
}

async function getKeypairFromSeed(seedPhrase) {
  const seed = await bip39.mnemonicToSeed(seedPhrase);
  const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key;
  return Keypair.fromSeed(derivedSeed.slice(0, 32));
}

function getKeypairFromPrivateKey(privateKey) {
  const decoded = bs58.decode(privateKey);
  return Keypair.fromSecretKey(decoded);
}

function parseEnvArray(envVar) {
  if (envVar === undefined) {
    return [];
  }

  try {
    return JSON.parse(envVar);
  } catch (e) {
    console.error('Failed to parse environment variable:', envVar, e);
    return [];
  }
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const header = `
\x1b[33mAUTO TRANSACTION BOT FOR SONIC ODYSSEY BY\x1b[0m

\x1b[31m _______  _______  _______  ___ ___  _______  _______  ___ ___  _______  _______  _______ 
|   _   ||   _   \\|   _   ||   Y   ||   _   ||       ||   Y   ||   _   ||   Y   ||   _   |
|.  1   ||.  l   /|.  |   ||.      ||.  |   ||.|   | ||.  1   ||.  1___||.  |   ||   1___|
\x1b[37m|.  ____||.  _   1|.  |   ||. \\_/  ||.  |   |\\-|.  |-'|.  _   ||.  __)_ |.  |   ||____   |
|:  |    |:  |   ||:  1   ||:  1   ||:  1   |  |:  |  |:  |   ||:  1   ||:  1   ||:  1   |
|::.|    |::.|:. ||::.. . ||::.|:. ||::.. . |  |::.|  |::.|:. ||::.. . ||::.. . ||::.. . |
\`---'    \`--- ---'\`-------' \`--- ---'\`-------'  \`---'  \`--- ---'\`-------\`-------\`-------'

\x1b[36mRecoded by Mr. Promotheus - (origin: by Mnuralim)\x1b[0m
\x1b[36mTreat me es teh: \x1b[34m0x72b58b99cd197db013c110b5643fb64008c0a209\x1b[0m
\x1b[32mNot a professional coder!\x1b[0m
`;

  console.clear(); // Membersihkan konsol sebelum menampilkan header
  console.log(header);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Jumlah Tx per akun (def 100): ', async (transactionsPerKeypairInput) => {
    const transactionsPerKeypair = parseInt(transactionsPerKeypairInput) || 100;

    rl.question('Delay per Tx (def 10): ', async (delayBetweenTransactionsInput) => {
      const delayInSeconds = parseInt(delayBetweenTransactionsInput) || 10;
      const delayBetweenTransactions = delayInSeconds * 1000;

      const seedPhrases = parseEnvArray(process.env.SEED_PHRASES);
      const privateKeys = parseEnvArray(process.env.PRIVATE_KEYS);

      for (const seedPhrase of seedPhrases) {
        keypairs.push(await getKeypairFromSeed(seedPhrase));
      }

      for (const privateKey of privateKeys) {
        keypairs.push(getKeypairFromPrivateKey(privateKey));
      }

      if (keypairs.length === 0) {
        throw new Error('No valid SEED_PHRASES or PRIVATE_KEYS found in the .env file');
      }

      const randomAddresses = generateRandomAddresses(keypairs.length * transactionsPerKeypair);
      console.log(`Generated ${keypairs.length * transactionsPerKeypair} recipient addresses\n`);

      const delayBetweenAccounts = 15000; // delay antara akun
      const delayBetweenCycles = 24 * 60 * 60 * 1000; // 24 jam
      const delayBetweenTransactionsMs = delayBetweenTransactions; // delay antara transaksi dalam milidetik

      async function processTransactions() {
        for (let currentKeypairIndex = 0; currentKeypairIndex < keypairs.length; currentKeypairIndex++) {
          const keypair = keypairs[currentKeypairIndex];
          console.log(`======\n\x1b[32mAkun ${currentKeypairIndex + 1} | ${keypair.publicKey.toString()}\x1b[0m\n`);

          let successCount = 0;
          for (let i = 1; i <= transactionsPerKeypair; i++) {
            const address = randomAddresses[(currentKeypairIndex * transactionsPerKeypair) + i - 1];
            const toPublicKey = new PublicKey(address);

            try {
              const randomAmount = Math.random() * 0.0005 + 0.001; // Generate random amount between 0.001 and 0.0015 SOL
              const amountInLamports = Math.round(randomAmount * LAMPORTS_PER_SOL); // Convert to lamports and round to nearest integer

              // Pilih proxy berdasarkan indeks akun ke dalam array proxies
              const proxy = proxies[currentKeypairIndex % proxies.length];

              await sendSol(keypair, toPublicKey, amountInLamports, proxy);
              successCount++;
              process.stdout.clearLine();
              process.stdout.cursorTo(0);
              process.stdout.write(`Transaksi berhasil: ${successCount}/${transactionsPerKeypair}`);
            } catch (error) {
              console.error(`Failed to send SOL:`, error);
            }

            await delay(delayBetweenTransactionsMs); // Jeda antara transaksi
          }

          if (currentKeypairIndex < keypairs.length - 1) {
            await countdownTimer(delayBetweenAccounts / 1000, false); // Countdown ke akun berikutnya
          } else {
            console.log('\n\n======');
            console.log('\x1b[34mSemua akun sudah diproses!\x1b[0m\n');
            await countdownTimer(delayBetweenCycles / 1000, true);
          }
        }
      }

      await processTransactions();

      rl.close();
    });
  });
}

async function countdownTimer(seconds, isCycleCountdown) {
  for (let i = seconds; i >= 0; i--) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    if (isCycleCountdown) {
      const countdown = formatCountdown(i * 1000);
      process.stdout.write(`\x1b[33mSemua akun akan diproses ulang dalam: ${countdown}\x1b[0m`);
    } else {
      const countdown = formatCountdown(i * 1000);
      process.stdout.write(`\x1b[33mPindah ke akun berikutnya dalam: ${countdown}\x1b[0m`);
    }
    await delay(1000);
  }
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
}

function formatCountdown(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
