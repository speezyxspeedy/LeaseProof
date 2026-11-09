import {
  Inspection,
  InspectionItem,
  PhotoRecord,
  Room,
  ItemComparisonResult,
  ComparisonDiffCategory,
  ConditionRating,
} from '../types';

const RATING_SCORE: Record<ConditionRating, number> = {
  EXCELLENT: 5,
  GOOD: 4,
  FAIR: 3,
  DAMAGED: 2,
  MISSING: 1,
  NOT_APPLICABLE: 0,
  NOT_INSPECTED: -1,
};

export function evaluateConditionDiff(
  before?: InspectionItem,
  after?: InspectionItem
): ComparisonDiffCategory {
  if (!before || !after) {
    return 'NOT_COMPARABLE';
  }

  const bCond = before.condition;
  const aCond = after.condition;

  if (bCond === 'NOT_INSPECTED' || aCond === 'NOT_INSPECTED') {
    return 'REQUIRES_REVIEW';
  }

  if (aCond === 'MISSING' && bCond !== 'MISSING') {
    return 'ITEM_MISSING';
  }

  if (aCond === 'DAMAGED' && bCond !== 'DAMAGED') {
    return 'NEW_DAMAGE';
  }

  const bScore = RATING_SCORE[bCond] ?? 0;
  const aScore = RATING_SCORE[aCond] ?? 0;

  if (bScore === aScore) {
    return 'NO_CHANGE';
  }

  if (aScore > bScore) {
    return 'IMPROVED';
  }

  return 'CONDITION_DECLINED';
}

export function buildComparison(
  _moveInInspection: Inspection,
  _moveOutInspection: Inspection,
  rooms: Room[],
  moveInItems: InspectionItem[],
  moveOutItems: InspectionItem[],
  moveInPhotos: PhotoRecord[],
  moveOutPhotos: PhotoRecord[]
): ItemComparisonResult[] {
  const results: ItemComparisonResult[] = [];

  // Group items by room
  for (const room of rooms) {
    const rMoveInItems = moveInItems.filter((i) => i.room_id === room.id);
    const rMoveOutItems = moveOutItems.filter((i) => i.room_id === room.id);

    // Track matched after items
    const visitedAfterIds = new Set<string>();

    for (const bItem of rMoveInItems) {
      // Find matching item in move-out
      const matchAfter = rMoveOutItems.find(
        (a) => a.item_name.trim().toLowerCase() === bItem.item_name.trim().toLowerCase()
      );

      if (matchAfter) {
        visitedAfterIds.add(matchAfter.id);
        const bPhotos = moveInPhotos.filter((p) => p.inspection_item_id === bItem.id);
        const aPhotos = moveOutPhotos.filter((p) => p.inspection_item_id === matchAfter.id);

        results.push({
          itemName: bItem.item_name,
          category: bItem.category,
          roomName: room.room_name,
          roomId: room.id,
          beforeItem: bItem,
          afterItem: matchAfter,
          beforePhotos: bPhotos,
          afterPhotos: aPhotos,
          diffCategory: evaluateConditionDiff(bItem, matchAfter),
          notesDiff: matchAfter.notes !== bItem.notes ? matchAfter.notes : undefined,
          costDiff: matchAfter.estimated_repair_cost || 0,
        });
      } else {
        // Existed in move-in but missing in move-out checklist
        const bPhotos = moveInPhotos.filter((p) => p.inspection_item_id === bItem.id);
        results.push({
          itemName: bItem.item_name,
          category: bItem.category,
          roomName: room.room_name,
          roomId: room.id,
          beforeItem: bItem,
          afterItem: undefined,
          beforePhotos: bPhotos,
          afterPhotos: [],
          diffCategory: 'NOT_COMPARABLE',
        });
      }
    }

    // New items in move-out that were not in move-in
    for (const aItem of rMoveOutItems) {
      if (!visitedAfterIds.has(aItem.id)) {
        const aPhotos = moveOutPhotos.filter((p) => p.inspection_item_id === aItem.id);
        results.push({
          itemName: aItem.item_name,
          category: aItem.category,
          roomName: room.room_name,
          roomId: room.id,
          beforeItem: undefined,
          afterItem: aItem,
          beforePhotos: [],
          afterPhotos: aPhotos,
          diffCategory: 'NOT_COMPARABLE',
          costDiff: aItem.estimated_repair_cost || 0,
        });
      }
    }
  }

  return results;
}
