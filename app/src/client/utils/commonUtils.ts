export function generateNatsUrl(natsUrl: string | undefined, fastAgencyServerUrl: string): string {
  return natsUrl ? natsUrl : fastAgencyServerUrl.replace('https://', 'tls://') + ':4222';
}
