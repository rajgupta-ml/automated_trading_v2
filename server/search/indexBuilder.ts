import { connectToRedis } from '../utils/redis';
import path from 'path';
import fs from 'fs/promises';
import process from 'process';
import type { Instrument } from '../types/upstox.types';
export const buildHashIndex = async () => {
    const client = await connectToRedis();

    try {
        const filePath = path.join(process.cwd(), 'data/NSE.json');
        const rawData = await fs.readFile(filePath, 'utf-8');
        const instruments = JSON.parse(rawData) as Instrument[];

        const pipeline = client.multi();
        let count = 0;
        for (const instrument of Object.values(instruments)) {
            if (
                instrument.instrument_type === 'EQ' ||
                instrument.instrument_type === 'FO'
            ) {
                if (instrument.name) {
                    const nameKey = `exact_name:${instrument.name.toLowerCase()}`;
                    pipeline.set(nameKey, JSON.stringify(instrument));
                    count++;
                }

                if (instrument.instrument_key) {
                    const instrumentKey = `exact_key:${instrument.instrument_key.toLowerCase()}`;
                    pipeline.set(instrumentKey, JSON.stringify(instrument));
                    count++;
                }

                pipeline.set(
                    instrument.instrument_key,
                    JSON.stringify(instrument),
                );
            }
        }

        await pipeline.exec();
        console.log(
            `✅ Hash Index built! Created ${count} exact match shortcuts`,
        );
    } catch (error) {
        console.error(error);
    } finally {
        client.quit();
    }
};

const buildTrieIndex = async () => {
    const client = await connectToRedis();

    const filePath = path.join(process.cwd(), 'data/NSE.json');
    const rawData = await fs.readFile(filePath, 'utf-8');
    const instruments = JSON.parse(rawData) as Instrument[];

    const pipeline = client.multi();
    let prefixCount = 0;

    try {
        Object.values(instruments).forEach((instrument) => {
            if (
                instrument.instrument_type === 'EQ' ||
                instrument.instrument_type === 'FO'
            ) {
                const searchableText = [
                    instrument.name || '',
                    instrument.instrument_key || '',
                ].filter((text) => text.length > 0);
                searchableText.forEach((text) => {
                    for (let i = 2; i <= text.length; i++) {
                        const prefix = text
                            .substring(0, i)
                            .toLowerCase()
                            .trim();
                        pipeline.zAdd(`prefix:${prefix}`, [
                            {
                                score: text.length,
                                value: JSON.stringify(instrument),
                            },
                        ]);
                        prefixCount++;
                    }
                });
            }
        });

        await pipeline.exec();
        console.log(
            `✅ Trie Index built! Created ${prefixCount} prefix shortcuts`,
        );
    } catch (error) {
        console.error('❌ Error building trie index:', error);
    } finally {
        client.quit();
    }
};

buildHashIndex();
buildTrieIndex();
