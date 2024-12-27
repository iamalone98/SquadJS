export type TPluginsState = {
    discord?: TDiscord;
};
type TDiscord = {
    sendMessage: (channelId: string, text: string) => void;
};
export {};
