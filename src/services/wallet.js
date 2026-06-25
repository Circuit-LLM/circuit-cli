// Wallet service — SOL + CIRC balances, transfers, and Jupiter swaps.
// CIRC is a Token-2022 mint, so transfers use the Token-2022 program id.
import {
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  VersionedTransaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddressSync,
  createTransferCheckedInstruction,
  createAssociatedTokenAccountIdempotentInstruction,
  getAccount,
} from '@solana/spl-token';
import { getConnection, loadKeypair, PK, PublicKey } from './solana.js';
import { CIRC, SOL_MINT } from '../config.js';
import { getJson, postJson } from './http.js';

const JUP = 'https://lite-api.jup.ag/swap/v1';

export function makeWallet({ address } = {}) {
  const keypair = loadKeypair();
  const connection = getConnection();
  const pubkey = keypair ? keypair.publicKey : address ? new PublicKey(address) : null;

  return {
    keypair,
    connection,
    address: pubkey ? pubkey.toBase58() : null,
    readOnly: !keypair,

    async solBalance() {
      if (!pubkey) return null;
      const lamports = await connection.getBalance(pubkey, 'confirmed');
      return lamports / LAMPORTS_PER_SOL;
    },

    async circBalance() {
      if (!pubkey) return 0;
      const ata = getAssociatedTokenAddressSync(PK.circMint, pubkey, false, PK.token2022);
      try {
        const acc = await getAccount(connection, ata, 'confirmed', PK.token2022);
        return Number(acc.amount) / 10 ** CIRC.decimals;
      } catch {
        return 0; // no ATA yet = zero balance
      }
    },

    // Transfer CIRC (Token-2022). amountRaw is a BigInt of base units.
    async sendCirc(toAddress, amountRaw) {
      if (!keypair) throw new Error('No wallet loaded — set CIRCUIT_WALLET or ~/.circuit/id.json');
      const to = new PublicKey(toAddress);
      const fromAta = getAssociatedTokenAddressSync(PK.circMint, keypair.publicKey, false, PK.token2022);
      const toAta = getAssociatedTokenAddressSync(PK.circMint, to, false, PK.token2022);
      const tx = new Transaction().add(
        createAssociatedTokenAccountIdempotentInstruction(keypair.publicKey, toAta, to, PK.circMint, PK.token2022),
        createTransferCheckedInstruction(fromAta, PK.circMint, toAta, keypair.publicKey, amountRaw, CIRC.decimals, [], PK.token2022),
      );
      return sendAndConfirmTransaction(connection, tx, [keypair], { commitment: 'confirmed' });
    },

    async sendSol(toAddress, sol) {
      if (!keypair) throw new Error('No wallet loaded — set CIRCUIT_WALLET or ~/.circuit/id.json');
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: new PublicKey(toAddress),
          lamports: Math.round(sol * LAMPORTS_PER_SOL),
        }),
      );
      return sendAndConfirmTransaction(connection, tx, [keypair], { commitment: 'confirmed' });
    },

    // Jupiter quote (read-only). amountRaw = base units of inputMint.
    async swapQuote(inputMint, outputMint, amountRaw, slippageBps = 100) {
      const u = `${JUP}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountRaw}&slippageBps=${slippageBps}&restrictIntermediateTokens=true`;
      return getJson(u, { timeout: 12000 });
    },

    // Execute a swap via Jupiter (sign + send the returned versioned tx).
    async swap(inputMint, outputMint, amountRaw, slippageBps = 100) {
      if (!keypair) throw new Error('No wallet loaded — cannot swap');
      const quote = await this.swapQuote(inputMint, outputMint, amountRaw, slippageBps);
      const { swapTransaction } = await postJson(`${JUP}/swap`, {
        quoteResponse: quote,
        userPublicKey: this.address,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
      });
      const tx = VersionedTransaction.deserialize(Buffer.from(swapTransaction, 'base64'));
      tx.sign([keypair]);
      const sig = await connection.sendRawTransaction(tx.serialize(), { maxRetries: 3 });
      await connection.confirmTransaction(sig, 'confirmed');
      return { sig, quote };
    },
  };
}

export const MINTS = { CIRC: CIRC.mint, SOL: SOL_MINT };
