import { BOOST_ALL_ARTICLES } from '../src/data/boostArticlesAllServer.ts';
import {
  getDripScheduleSummary,
  getPublishedBatchForDate,
  getVietnamTodayIso,
} from '../src/data/publishSchedule.ts';

const today = getVietnamTodayIso();
const summary = getDripScheduleSummary(BOOST_ALL_ARTICLES, today);
const todayBatch = getPublishedBatchForDate(BOOST_ALL_ARTICLES, today);

console.log('=== DOMATION SEO DRIP PUBLISH SCHEDULE ===');
console.log(`Effective date (ICT / UTC+7): ${summary.asOfDate}`);
console.log(`Total library size:           ${summary.totalCount}`);
console.log(`Baseline permanently live:    ${summary.baselineCount}`);
console.log(`Currently published:          ${summary.publishedCount} (+${summary.todayBatchCount} unlocked today)`);
console.log(`Remaining scheduled:          ${summary.scheduledCount}`);
if (summary.nextPublishDate) {
  console.log(`Next scheduled unlock:        ${summary.nextPublishDate} (+${summary.nextBatchCount} articles)`);
} else {
  console.log('Next scheduled unlock:        All articles published');
}

console.log('\n10-Day Release Calendar:');
console.table(
  summary.batches.map((b) => ({
    date: b.date,
    status: b.date <= today ? (b.date === today ? 'TODAY' : 'LIVE') : 'QUEUED',
    batchCount: b.count,
    cumulativePublished: b.cumulative,
    sampleIds: `${b.articleIds[0]} .. ${b.articleIds[b.articleIds.length - 1]}`,
  }))
);

if (todayBatch.length > 0) {
  console.log(`\nToday's Batch (${todayBatch.length} articles unlocked on ${today}):`);
  for (const art of todayBatch) {
    console.log(`  - [${art.id}] (${art.pillar}) /boost/${art.slug}`);
  }
} else {
  console.log(`\nNo expansion batch unlocked specifically for ${today}.`);
}
