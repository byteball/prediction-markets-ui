import appConfig from "appConfig";

import { isDrawAllowed } from "./isDrawAllowed";

// Cutoff configured in appConfig: '2026-06-28T19:00:00Z' => unix 1782673200.
// Matches before it belong to the group stage (draws possible); matches at/after it
// belong to the knockout (playoff) stage where a draw can no longer happen.
const CUTOFF_UNIX = 1782673200;

// Real example from https://prophet.ooo/api/calendar/soccer/WC/1
// { championship: "WC", event_date: 1781830800, feed_name: "WC_MEX_KOR_2026-06-19", league: "FIFA World Cup" }
// 1781830800 === 2026-06-19 01:00:00 UTC -> group stage.
const WC_GROUP_STAGE_EVENT_DATE = 1781830800;

describe("isDrawAllowed", () => {
  it("allows a draw for any non-FIFA-World-Cup league, even after the cutoff", () => {
    expect(isDrawAllowed("Premier League", CUTOFF_UNIX + 86400)).toBe(true);
    expect(isDrawAllowed("La Liga", WC_GROUP_STAGE_EVENT_DATE)).toBe(true);
    expect(isDrawAllowed(undefined, CUTOFF_UNIX + 86400)).toBe(true);
  });

  it("allows a draw for a FIFA World Cup group-stage match (before the cutoff)", () => {
    expect(isDrawAllowed("FIFA World Cup", WC_GROUP_STAGE_EVENT_DATE)).toBe(true);
  });

  it("forbids a draw for a FIFA World Cup knockout match (after the cutoff)", () => {
    expect(isDrawAllowed("FIFA World Cup", 1783022400)).toBe(false); // 2026-07-02 20:00 UTC
  });

  it("forbids a draw for a FIFA World Cup match kicking off exactly at the cutoff", () => {
    expect(isDrawAllowed("FIFA World Cup", CUTOFF_UNIX)).toBe(false);
  });

  it("allows a draw for a FIFA World Cup match kicking off one second before the cutoff", () => {
    expect(isDrawAllowed("FIFA World Cup", CUTOFF_UNIX - 1)).toBe(true);
  });

  describe("when the cutoff is not configured", () => {
    const originalCutoff = appConfig.ALLOW_DRAW_IN_FIFA_WORLD_CUP_BEFORE;

    afterEach(() => {
      appConfig.ALLOW_DRAW_IN_FIFA_WORLD_CUP_BEFORE = originalCutoff;
    });

    it("forbids draws for every FIFA World Cup match when the cutoff is null", () => {
      appConfig.ALLOW_DRAW_IN_FIFA_WORLD_CUP_BEFORE = null;

      expect(isDrawAllowed("FIFA World Cup", WC_GROUP_STAGE_EVENT_DATE)).toBe(false);
      expect(isDrawAllowed("FIFA World Cup", 1783022400)).toBe(false);
    });

    it("still allows draws for other leagues when the cutoff is null", () => {
      appConfig.ALLOW_DRAW_IN_FIFA_WORLD_CUP_BEFORE = null;

      expect(isDrawAllowed("Premier League", WC_GROUP_STAGE_EVENT_DATE)).toBe(true);
    });
  });
});
