import { useEffect } from "react";
import "./App.css";

export default function App() {
  useEffect(() => {
    const playerPageUrl = "/pfr/players/B/BradTo00.htm";

    const normalizeText = (value) => value.replace(/\s+/g, " ").trim();

    const parseNumber = (value) => {
      if (!value) return null;
      const normalized = value.replace(/,/g, "").replace(/%/g, "").trim();
      const numeric = Number(normalized);
      return Number.isNaN(numeric) ? null : numeric;
    };

    const getMetaText = (documentRoot) => {
      const meta = documentRoot.querySelector("#meta");
      if (!meta) return "";
      const paragraphs = Array.from(meta.querySelectorAll("p"));
      return normalizeText(paragraphs.map((p) => p.textContent || "").join(" • "));
    };

    const getMetaMap = (documentRoot) => {
      const meta = documentRoot.querySelector("#meta");
      if (!meta) return new Map();

      const map = new Map();
      const paragraphs = Array.from(meta.querySelectorAll("p"));

      paragraphs.forEach((paragraph) => {
        let currentLabel = null;
        let currentValue = "";

        paragraph.childNodes.forEach((node) => {
          if (
            node.nodeType === Node.ELEMENT_NODE &&
            node.nodeName.toLowerCase() === "strong"
          ) {
            if (currentLabel) {
              const cleanedValue = normalizeText(currentValue);
              if (cleanedValue) {
                map.set(currentLabel, cleanedValue);
              }
            }
            currentLabel = normalizeText(node.textContent || "").replace(/:$/, "");
            currentValue = "";
          } else {
            currentValue += node.textContent || "";
          }
        });

        if (currentLabel) {
          const cleanedValue = normalizeText(currentValue);
          if (cleanedValue) {
            map.set(currentLabel, cleanedValue);
          }
        }
      });

      return map;
    };

    const getMetaField = (metaMap, label) => metaMap.get(label) || null;

    const getHeightWeight = (metaMap, metaText) => {
      const labeled = metaMap.get("Height/Weight");
      if (labeled) return labeled;
      const match = metaText.match(/\b\d-\d,\s*\d+lb[^•]*/i);
      return match ? normalizeText(match[0]) : null;
    };

    const getCareerRow = (table) => {
      if (!table) return null;
      const candidates = Array.from(
        table.querySelectorAll("tfoot tr, tbody tr, tr")
      );

      const getYearCellText = (row) =>
        normalizeText(
          row.querySelector(
            'th[data-stat="year_id"], th[data-stat="season"], th[data-stat="year"]'
          )?.textContent || ""
        );

      const isCareerRow = (row) => {
        const yearCell = getYearCellText(row);
        if (yearCell && /career/i.test(yearCell)) return true;
        if (yearCell && /\d+\s*yrs?/i.test(yearCell)) return true;
        const rowText = normalizeText(row.textContent || "");
        return /career/i.test(rowText);
      };

      return candidates.find(isCareerRow) || null;
    };

    const getStatValue = (row, stat) =>
      normalizeText(
        row?.querySelector(`[data-stat="${stat}"]`)?.textContent || ""
      );

    const getStatNumber = (row, stat) => parseNumber(getStatValue(row, stat));

    const getStatNumberAny = (row, stats) => {
      for (const stat of stats) {
        const value = getStatNumber(row, stat);
        if (value !== null) return value;
      }
      return null;
    };

    const getStatValueAny = (row, stats) => {
      for (const stat of stats) {
        const value = getStatValue(row, stat);
        if (value) return value;
      }
      return null;
    };

    const getSuperBowlRecord = (tables) => {
      const superBowlTable = tables.find((table) => {
        const caption = normalizeText(
          table.querySelector("caption")?.textContent || ""
        );
        const id = table.getAttribute("id") || "";
        return /super bowl/i.test(caption) || /super[_-]?bowl/i.test(id);
      });

      if (!superBowlTable) return { wins: null, losses: null };

      let wins = 0;
      let losses = 0;
      const rows = Array.from(superBowlTable.querySelectorAll("tbody tr"));
      for (const row of rows) {
        const resultText = normalizeText(
          row.querySelector('[data-stat="game_result"]')?.textContent ||
            row.querySelector('[data-stat="result"]')?.textContent ||
            ""
        );
        if (/^W\b/i.test(resultText)) wins += 1;
        if (/^L\b/i.test(resultText)) losses += 1;
      }

      return { wins, losses };
    };

    const collectCommentTables = (documentRoot) => {
      const walker = documentRoot.createTreeWalker(
        documentRoot,
        NodeFilter.SHOW_COMMENT
      );

      const tables = [];
      let current = walker.nextNode();

      while (current) {
        const commentText = current.nodeValue || "";
        if (commentText.includes("<table")) {
          const commentDoc = new DOMParser().parseFromString(
            commentText,
            "text/html"
          );
          tables.push(...Array.from(commentDoc.querySelectorAll("table")));
        }
        current = walker.nextNode();
      }

      return tables;
    };

    const findTable = (documentRoot, commentTables, selector) =>
      documentRoot.querySelector(selector) ||
      commentTables.find((table) => table.matches(selector)) ||
      null;

    const findTableByIdContains = (tables, fragment) =>
      tables.find((table) =>
        (table.getAttribute("id") || "").toLowerCase().includes(fragment)
      );

    const findPlayoffPassingTable = (documentRoot, commentTables) => {
      const tables = [
        ...Array.from(documentRoot.querySelectorAll("table")),
        ...commentTables,
      ];

      return (
        findTable(documentRoot, commentTables, "table#passing_playoffs") ||
        findTableByIdContains(tables, "passing_playoffs") ||
        findTableByIdContains(tables, "passing_post") ||
        tables.find((table) =>
          /playoffs?/i.test(
            normalizeText(table.getAttribute("data-table") || "")
          )
        ) ||
        null
      );
    };

    const fetchPlayerPage = async () => {
      const response = await fetch(playerPageUrl);
      if (!response.ok) {
        throw new Error(`Player page request failed with ${response.status}`);
      }
      return response.text();
    };

    const buildPlayerJson = (htmlText) => {
      const parser = new DOMParser();
      const documentRoot = parser.parseFromString(htmlText, "text/html");
      const commentTables = collectCommentTables(documentRoot);

      const metaText = getMetaText(documentRoot);
      const metaMap = getMetaMap(documentRoot);
      const playerName = normalizeText(
        documentRoot.querySelector("#meta h1")?.textContent || ""
      );
      const position = getMetaField(metaMap, "Position");
      const throwsHand = getMetaField(metaMap, "Throws");
      const born = getMetaField(metaMap, "Born");
      const college = getMetaField(metaMap, "College");
      const heightWeight = getHeightWeight(metaMap, metaText);

      const passingTable = findTable(documentRoot, commentTables, "table#passing");
      const playoffPassingTable = findPlayoffPassingTable(
        documentRoot,
        commentTables
      );

      const careerPassingRow = getCareerRow(passingTable);
      const playoffPassingRow = getCareerRow(playoffPassingTable);

      const allTables = [
        ...Array.from(documentRoot.querySelectorAll("table")),
        ...commentTables,
      ];
      const superBowlRecord = getSuperBowlRecord(allTables);

      const playerId = playerPageUrl.split("/").pop()?.replace(".htm", "") || null;

      return {
        playerId,
        playerUrl: `https://www.pro-football-reference.com/players/B/${playerId}.htm`,
        playerName: playerName || null,
        position,
        throws: throwsHand,
        gamesPlayed: getStatNumberAny(careerPassingRow, ["g", "games"]),
        careerRecord: getStatValueAny(careerPassingRow, [
          "qb_rec",
          "record",
          "qb_record",
        ]),
        postSeasonRecord: getStatValueAny(playoffPassingRow, [
          "qb_rec",
          "record",
          "qb_record",
        ]),
        superBowlRecord,
        bio: {
          born,
          heightWeight,
          college,
        },
        passingStats: {
          careerPassingYards: getStatNumber(careerPassingRow, "pass_yds"),
          passingAttempts: getStatNumber(careerPassingRow, "pass_att"),
          passingCompletions: getStatNumber(careerPassingRow, "pass_cmp"),
          completionPct: getStatNumber(careerPassingRow, "pass_cmp_pct"),
          passingTouchdowns: getStatNumber(careerPassingRow, "pass_td"),
          interceptions: getStatNumber(careerPassingRow, "pass_int"),
          yardsPerAttempt: getStatNumber(careerPassingRow, "pass_yds_per_att"),
          adjustedYardsPerAttempt: getStatNumber(
            careerPassingRow,
            "pass_adj_yds_per_att"
          ),
          passerRating: getStatNumber(careerPassingRow, "pass_rating"),
          qbr: getStatNumber(careerPassingRow, "qbr"),
          firstDowns: getStatNumber(careerPassingRow, "pass_first_down"),
          sacks: getStatNumber(careerPassingRow, "pass_sacked"),
          sackYards: getStatNumber(careerPassingRow, "pass_sacked_yds"),
        },
        postseasonPassingStats: {
          gamesPlayed: getStatNumberAny(playoffPassingRow, ["g", "games"]),
          passingYards: getStatNumber(playoffPassingRow, "pass_yds"),
          passingTouchdowns: getStatNumber(playoffPassingRow, "pass_td"),
          interceptions: getStatNumber(playoffPassingRow, "pass_int"),
          passerRating: getStatNumber(playoffPassingRow, "pass_rating"),
        },
      };
    };

    const loadPlayerProfile = async () => {
      try {
        const htmlText = await fetchPlayerPage();
        const playerJson = buildPlayerJson(htmlText);
        console.log("Player summary JSON:", JSON.stringify(playerJson, null, 2));
      } catch (error) {
        console.error("Failed to fetch player page:", error);
      }
    };

    loadPlayerProfile();
  }, []);

  return (
    <div className="appShell">
      <main className="appCard">
        <p className="appKicker">Am I HOFer</p>
        <h1 className="appTitle">Player data fetch</h1>
        <p className="appDescription">
          Fetching player data from Pro-Football-Reference. Check the browser
          console for the response payload.
        </p>
      </main>
    </div>
  );
}
