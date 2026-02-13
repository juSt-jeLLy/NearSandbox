import { OpenAPI, QuoteRequest, OneClickService } from '@defuse-protocol/one-click-sdk-typescript';
import assetIds from './assetids.json';

OpenAPI.BASE = 'https://1click.chaindefuser.com';
OpenAPI.TOKEN = process.env.VITE_TOKEN;

interface AssetMeta {
  assetId: string;
  blockchain: string;
  symbol: string;
  decimals?: number;
}

const getAssetInfo = (blockchain: string, symbol: string): AssetMeta => {
  const assets = assetIds as AssetMeta[];

  const match = assets.find(
    (a) =>
      a.blockchain.toLowerCase() === blockchain.toLowerCase() &&
      a.symbol.toUpperCase() === symbol.toUpperCase()
  );

  if (!match) {
    throw new Error(`Asset not found for ${blockchain}:${symbol}`);
  }

  return match;
};

const getAssetId = (blockchain: string, symbol: string): string => {
  return getAssetInfo(blockchain, symbol).assetId;
};

/**
 * Convert amount from human-readable format to smallest units based on asset decimals.
 * Handles both decimal strings (e.g., "100.5") and integer strings (e.g., "100").
 */
const convertToSmallestUnits = (amount: string, decimals: number): string => {
  // Parse the amount
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) {
    throw new Error(`Invalid amount format: ${amount}`);
  }
  
  // Multiply by 10^decimals to convert to smallest units
  const multiplier = Math.pow(10, decimals);
  const smallestUnits = Math.floor(numAmount * multiplier);
  
  return smallestUnits.toString();
};

export const dryRun = async (
  originBlockchain: string,
  originSymbol: string,
  destBlockchain: string,
  destSymbol: string,
  amount: string,
  refundTo: string,
  recipient: string
) => {
  const originAsset = getAssetInfo(originBlockchain, originSymbol);
  const destAsset = getAssetInfo(destBlockchain, destSymbol);
  const originAssetId = originAsset.assetId;
  const destinationAssetId = destAsset.assetId;
  
  console.log('originAssetId:', originAssetId);
  console.log('destinationAssetId:', destinationAssetId);
  console.log('originAsset decimals:', originAsset.decimals);
  console.log('raw amount:', amount);
  
  // Convert amount to smallest units if needed (based on origin asset decimals)
  const originDecimals = originAsset.decimals || 6; // Default to 6 for USDC
  const amountInSmallestUnits = convertToSmallestUnits(amount, originDecimals);
  console.log('amount in smallest units:', amountInSmallestUnits);
  // Set deadline to 1 hour from now
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + 1);
  const deadlineISO = deadline.toISOString();

  const quoteRequest: QuoteRequest = {
    dry: false,
    swapType: QuoteRequest.swapType.EXACT_INPUT,
    slippageTolerance: 100, // 1%
    originAsset: originAssetId,
    depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
    destinationAsset: destinationAssetId,
    amount: amountInSmallestUnits, // Use converted amount
    refundTo,
    refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
    recipient,
    recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
    deadline: deadlineISO,
  };

  console.log('Quote request payload:', JSON.stringify(quoteRequest, null, 2));

  // Get quote (includes deposit address for executing the swap)
  let quote;
  try {
    quote = await OneClickService.getQuote(quoteRequest);
  } catch (error: any) {
    console.error('1Click API Error Details:', {
      status: error.status,
      body: error.body,
      message: error.message,
    });
    // Log the full request for debugging
    console.error('Failed request:', quoteRequest);
    throw error;
  }
  console.log('1Click quote response:', quote);

  // The deposit address is where the user should send funds on the origin chain
  const depositAddress = (quote as any).quote?.depositAddress;
  if (depositAddress) {
    console.log('Deposit Address:', depositAddress);
  }

  return {
    quote,
    depositAddress,
  };
};

/**
 * Inform the 1Click API about an already-sent origin-chain deposit transaction.
 * You must obtain `txHash` from the user's OP wallet (e.g. MetaMask).
 */
export const submitDepositTx = async (txHash: string, depositAddress: string) => {
  const result = await OneClickService.submitDepositTx({
    txHash,
    depositAddress,
  });

  console.log('1Click submitDepositTx result:', result);
  return result;
};

/**
 * Check cross-chain execution status for a given deposit address.
 */
export const getExecutionStatus = async (depositAddress: string) => {
  const status = await OneClickService.getExecutionStatus(depositAddress);
  console.log('1Click execution status:', status);
  return status;
};
