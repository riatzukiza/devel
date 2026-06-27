import test from 'node:test';
import assert from 'node:assert/strict';
import { latestCorrectedText, renderTranslatedDocument } from '../dist/lib/translation-rendering.js';

test('prefers the latest corrected text for a reviewed segment', () => {
  const segment = { _id: 'seg-1', translated_text: 'Original machine translation', segment_index: 0 };
  const labels = [
    { segment_id: 'seg-1', corrected_text: 'Older correction', created_at: '2026-04-13T10:00:00.000Z' },
    { segment_id: 'seg-1', corrected_text: 'Latest correction', created_at: '2026-04-13T11:00:00.000Z' },
  ];
  assert.equal(latestCorrectedText(segment, labels), 'Latest correction');
});

test('renders a document with corrected reviewed segments and untouched machine text elsewhere', () => {
  const segments = [
    { _id: 'seg-1', translated_text: 'Segment one machine text', segment_index: 0 },
    { _id: 'seg-2', translated_text: 'Segment two machine text', segment_index: 1 },
  ];
  const labelsBySegmentId = new Map([
    ['seg-2', [{ segment_id: 'seg-2', corrected_text: 'Segment two corrected text', created_at: '2026-04-13T12:00:00.000Z' }]],
  ]);
  assert.equal(
    renderTranslatedDocument(segments, labelsBySegmentId),
    'Segment one machine text\n\nSegment two corrected text',
  );
});
