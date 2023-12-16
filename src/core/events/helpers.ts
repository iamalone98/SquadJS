export const convertObjToArrayEvents = (events: {
  [key in string]: string;
}) => Object.keys(events).map((event) => event);
