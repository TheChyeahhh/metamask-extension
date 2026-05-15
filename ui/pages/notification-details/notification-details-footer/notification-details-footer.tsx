import React from 'react';
import type { INotification } from '@metamask/notification-services-controller/notification-services';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import {
  NotificationComponentType,
  type NotificationComponent,
} from '../../notifications/notification-components/types/notifications/notifications';

type NotificationDetailsFooterProps = {
  footer: NonNullable<NotificationComponent['details']>['footer'];
  notification: INotification;
};

export const NotificationDetailsFooter = ({
  footer,
  notification,
}: NotificationDetailsFooterProps) => {
  return (
    <Box
      className="w-full"
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Between}
      padding={4}
      gap={4}
    >
      {footer.type === NotificationComponentType.OnChainFooter && (
        <footer.ScanLink notification={notification} />
      )}
      {footer.type === NotificationComponentType.AnnouncementFooter && (
        <Box gap={4} flexDirection={BoxFlexDirection.Row} className="w-full">
          <footer.ExternalLink notification={notification} />
          <footer.ExtensionLink notification={notification} />
        </Box>
      )}
      {footer.type === NotificationComponentType.SnapFooter && (
        <footer.Link notification={notification} />
      )}
    </Box>
  );
};
