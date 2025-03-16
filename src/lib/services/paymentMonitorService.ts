import type { Address } from 'viem';
import { checkActivationStatus } from './activationService';

// Store for active payment monitors
const activeMonitors: Map<string, {
  intervalId: number;
  onSuccess: () => void;
  onError: (error: Error) => void;
  chainId?: number;
}> = new Map();

/**
 * Starts monitoring for a payment from a specific wallet
 * @param walletAddress The wallet address to monitor
 * @param onSuccess Callback function to execute when payment is confirmed
 * @param onError Callback function to execute on error
 * @param chainId Optional chain ID to monitor for a specific chain
 * @param intervalMs How often to check for payment (default: 15000ms = 15s)
 * @returns A function to stop the monitoring
 */
export function startPaymentMonitor(
  walletAddress: Address,
  onSuccess: () => void,
  onError: (error: Error) => void,
  chainId?: number,
  intervalMs: number = 15000
): () => void {
  // Stop any existing monitor for this wallet
  stopPaymentMonitor(walletAddress);

  // Function to check payment status
  const checkPayment = async () => {
    try {
      const status = await checkActivationStatus(walletAddress, chainId);

      if (status.success) {
        if (status.status === 'payment_verified' || status.status === 'payment_confirmed') {
          // Payment confirmed, stop monitoring and call success callback
          stopPaymentMonitor(walletAddress);
          onSuccess();
        }
      } else if (status.error) {
        onError(new Error(status.error));
      }
    } catch (error) {
      console.error('Error in payment monitor:', error);
      onError(error instanceof Error ? error : new Error('Unknown error in payment monitor'));
    }
  };

  // Start the interval
  const intervalId = window.setInterval(checkPayment, intervalMs);

  // Store the monitor
  activeMonitors.set(walletAddress, { intervalId, onSuccess, onError, chainId });

  // Return a function to stop the monitor
  return () => stopPaymentMonitor(walletAddress);
}

/**
 * Stops monitoring for a payment from a specific wallet
 * @param walletAddress The wallet address to stop monitoring
 */
export function stopPaymentMonitor(walletAddress: Address): void {
  const monitor = activeMonitors.get(walletAddress);

  if (monitor) {
    window.clearInterval(monitor.intervalId);
    activeMonitors.delete(walletAddress);
  }
}

/**
 * Stops all active payment monitors
 */
export function stopAllPaymentMonitors(): void {
  for (const [address, monitor] of activeMonitors.entries()) {
    window.clearInterval(monitor.intervalId);
    activeMonitors.delete(address);
  }
}
