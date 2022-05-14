export const domain_props = {
    name: process.env.ARMADA_CUSTOM_DOMAIN as string,
    regionalDomainName: process.env.ARMADA_API_GATEWAY_DOMAIN as string,
    regionalHostedZoneId: process.env.ARMADA_HOSTED_ZONE_ID as string,
}