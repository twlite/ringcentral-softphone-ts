import fs from 'fs';
import type { RtpPacket } from 'werift-rtp';
import waitFor from 'wait-for-async';

import Softphone from '../src/softphone';

const softphone = new Softphone({
  username: process.env.SIP_INFO_USERNAME,
  password: process.env.SIP_INFO_PASSWORD,
  authorizationId: process.env.SIP_INFO_AUTHORIZATION_ID,
});
softphone.enableDebugMode(); // print all SIP messages

const main = async () => {
  await softphone.register();
  await waitFor({ interval: 1000 });
  // callee format sample: 16506668888, country code is required, otherwise behavior is undefined
  const callSession = await softphone.call(
    parseInt(process.env.CALLEE_FOR_TESTING!, 10),
    // parseInt(process.env.RINGCENTRAL_CALLER_ID!, 10), // Optionally, you can specify callerId as the second parameter
  );

  // callee answers the call
  callSession.once('answered', async () => {
    // receive audio
    const writeStream = fs.createWriteStream(`${callSession.callId}.raw`, { flags: 'a' });
    callSession.on('audioPacket', (rtpPacket: RtpPacket) => {
      writeStream.write(rtpPacket.payload);
    });
    // either you or the peer hang up
    callSession.once('disposed', () => {
      writeStream.close();
    });

    // // send audio to remote peer
    // callSession.streamAudio(fs.readFileSync('demos/test.raw'));

    // receive DTMF
    callSession.on('dtmf', (digit) => {
      console.log('dtmf', digit);
    });

    // // send DTMF
    // await waitFor({ interval: 2000 });
    // callSession.sendDTMF('1');
    // await waitFor({ interval: 2000 });
    // callSession.sendDTMF('#');

    // // hang up the call
    // await waitFor({ interval: 5000 });
    // callSession.hangup();
  });

  // // cancel the call (before the peer answers)
  // await waitFor({ interval: 8000 });
  // callSession.cancel();
};
main();
