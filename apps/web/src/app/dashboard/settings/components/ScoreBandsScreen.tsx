'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CefrSelect } from '@/components/CefrSelect';
import { EmptyState } from '@/components/EmptyState';
import { Input } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { useDashboardUser, usePlacement } from '@/shared/hooks';
import {
  placementRepository,
  type PlacementScoreBand,
} from '@/module/placement';
import { canManageScoreBands } from '@/utils/access';
import { getApiErrorMessage } from '@/utils/api-error-message';
import type { CefrLevel } from '@english-school/shared';

type BandDraft = {
  key: string;
  minScore: string;
  maxScore: string;
  cefrLevel: CefrLevel;
};

function toDraft(bands: PlacementScoreBand[]): BandDraft[] {
  return bands.map((band, index) => ({
    key: band.id ?? String(index),
    minScore: String(band.minScore),
    maxScore: String(band.maxScore),
    cefrLevel: band.cefrLevel,
  }));
}

export function ScoreBandsScreen() {
  const user = useDashboardUser();
  const placement = usePlacement();
  const [drafts, setDrafts] = useState<BandDraft[] | null>(null);
  const [saved, setSaved] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void placementRepository.listScoreBands().then((result) => {
      if (cancelled) {
        return;
      }
      if (result.isErr()) {
        setLoadError(getApiErrorMessage(result.error));
        return;
      }
      setDrafts(toDraft(result.value.data));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (!drafts) {
      return;
    }
    setSaved(false);
    const payload = drafts.map((row) => ({
      minScore: Number(row.minScore),
      maxScore: Number(row.maxScore),
      cefrLevel: row.cefrLevel,
    }));
    const result = await placement.replaceScoreBands(payload);
    if (result) {
      setDrafts(toDraft(result));
      setSaved(true);
    }
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold tracking-tight">
        How a score becomes a level
      </h2>
      <p className="mb-4 mt-1 text-sm text-muted">
        Overall diagnostic scores must cover every point once. No gaps, no
        overlaps.
      </p>
      {drafts === null ? (
        loadError ? (
          <Notice>{loadError}</Notice>
        ) : (
          <p className="text-sm text-muted">Loading…</p>
        )
      ) : (
        <form onSubmit={onSave} className="flex flex-col gap-4">
          {drafts.length === 0 ? (
            <EmptyState
              title="No ranges yet"
              description="Add at least one range, for example 0–20 → A1."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="text-[13px] text-muted">
                  <tr>
                    <th className="pb-3 font-medium">From</th>
                    <th className="pb-3 font-medium">To</th>
                    <th className="pb-3 font-medium">Level</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody>
                  {drafts.map((row, index) => (
                    <tr key={row.key} className="border-t border-line">
                      <td className="py-2 pr-2">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          required
                          value={row.minScore}
                          onChange={(event) => {
                            const next = [...drafts];
                            next[index] = {
                              ...row,
                              minScore: event.target.value,
                            };
                            setDrafts(next);
                          }}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          required
                          value={row.maxScore}
                          onChange={(event) => {
                            const next = [...drafts];
                            next[index] = {
                              ...row,
                              maxScore: event.target.value,
                            };
                            setDrafts(next);
                          }}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <CefrSelect
                          value={row.cefrLevel}
                          onChange={(value) => {
                            const next = [...drafts];
                            next[index] = {
                              ...row,
                              cefrLevel: value as CefrLevel,
                            };
                            setDrafts(next);
                          }}
                        />
                      </td>
                      <td className="py-2">
                        {canManageScoreBands(user.role) ? (
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-11 px-3"
                            onClick={() =>
                              setDrafts(drafts.filter((_, i) => i !== index))
                            }
                          >
                            Remove
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {placement.error ? <Notice>{placement.error}</Notice> : null}
          {saved ? <Notice tone="success">Saved.</Notice> : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setDrafts([
                  ...(drafts ?? []),
                  {
                    key: crypto.randomUUID(),
                    minScore: '0',
                    maxScore: '20',
                    cefrLevel: 'A1',
                  },
                ])
              }
            >
              Add range
            </Button>
            <Button
              type="submit"
              disabled={placement.pending || drafts.length === 0}
            >
              {placement.pending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
