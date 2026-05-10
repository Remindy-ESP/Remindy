const chunkPushNotifications = jest.fn();
const sendPushNotificationsAsync = jest.fn();

const ExpoMock = jest.fn().mockImplementation(() => {
  return {
    chunkPushNotifications,
    sendPushNotificationsAsync,
  };
});

// @ts-expect-error - ExpoMock is a jest fn, attaching static properties is fine in mock
ExpoMock.isExpoPushToken = jest.fn();

export const Expo = ExpoMock;
export default ExpoMock;
