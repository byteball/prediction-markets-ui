import { useEffect, useState } from "react";
import moment from "moment";

/** Current unix time (seconds), refreshed every `intervalMs` so countdowns and phases stay current. */
export const useNow = (intervalMs = 10_000): number => {
  const [now, setNow] = useState(() => moment.utc().unix());

  useEffect(() => {
    const intervalId = setInterval(() => setNow(moment.utc().unix()), intervalMs);

    return () => clearInterval(intervalId);
  }, [intervalMs]);

  return now;
};
