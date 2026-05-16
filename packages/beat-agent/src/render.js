import ffmpeg from 'fluent-ffmpeg';
import path from 'path';

export function wavToOgg(wavPath, outDir = '/tmp') {
  const name = path.basename(wavPath, '.wav');
  const oggPath = path.join(outDir, `${name}.ogg`);
  return new Promise((resolve, reject) => {
    ffmpeg(wavPath)
      .audioCodec('libopus')
      .audioBitrate('128k')
      .format('ogg')
      .on('end', () => resolve(oggPath))
      .on('error', reject)
      .save(oggPath);
  });
}
