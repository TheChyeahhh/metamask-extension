import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Player from './player';

const meta: Meta<typeof Player> = {
  title: 'Components/App/QRHardwareSignRequest/Player',
  component: Player,
  argTypes: {
    type: { control: 'text' },
    cbor: { control: 'text' },
    cancelQRHardwareSignRequest: { action: 'cancelQRHardwareSignRequest' },
    toRead: { action: 'toRead' },
  },
  args: {
    type: 'eth-sign-request',
    cbor: 'a501d825509b1deb4d3b7d4bad9bdd2b0d7b3dcb6802582101e8e8ef9191c1fc6eadd9d4db87fb74dbcb84c1f0b6d2ce3e0ee01dc21daf730358200e6b4dd6a5e840bae45ddb89aa5cd0ed7bcee3a90e0f78ea0fa3cc40cf543e0b0401',
  },
};

export default meta;

type Story = StoryObj<typeof Player>;

export const Default: Story = {};
