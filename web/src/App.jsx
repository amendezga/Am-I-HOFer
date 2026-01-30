import { useMemo, useState } from "react";
import "./App.css";

const HALL_OF_FAMERS = [
  "Tom Brady",
  "Peyton Manning",
  "Joe Montana",
  "Jerry Rice",
  "Lawrence Taylor",
  "Walter Payton",
  "Emmitt Smith",
  "Barry Sanders",
  "Randy Moss",
  "Deion Sanders",
  "Reggie White",
  "Brett Favre",
  "Dan Marino",
  "John Elway",
  "Shannon Sharpe",
  "Tony Gonzalez",
  "Ray Lewis",
  "Ed Reed",
  "Champ Bailey",
  "Terrell Owens",
  "Steve Largent",
  "Bruce Smith",
  "Mike Singletary",
  "Rod Woodson",
  "Troy Polamalu",
  "Marvin Harrison",
  "Curtis Martin",
  "LaDainian Tomlinson",
  "Drew Brees",
  "Calvin Johnson",
];

const normalizeName = (name) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[.'"-]/g, "")
    .replace(/\s+/g, " ");

const buildHofIndex = (names) =>
  names.reduce((index, name) => {
    index.set(normalizeName(name), name);
    return index;
  }, new Map());

export default function App() {
  const [query, setQuery] = useState("");
  const [submittedName, setSubmittedName] = useState("");

  const hofIndex = useMemo(() => buildHofIndex(HALL_OF_FAMERS), []);
  const normalizedQuery = normalizeName(submittedName);
  const matchedName = normalizedQuery ? hofIndex.get(normalizedQuery) : undefined;
  const hasMatch = Boolean(matchedName);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmittedName(query);
  };

  const resultMessage = submittedName
    ? hasMatch
      ? `${matchedName} is in the Hall of Fame.`
      : `${submittedName} is not in the Hall of Fame list yet.`
    : "Type a player name to check Hall of Fame status.";

  return (
    <div className="appShell">
      <main className="appCard">
        <p className="appKicker">Am I HOFer</p>
        <h1 className="appTitle">Hall of Fame check</h1>
        <p className="appDescription">
          Enter an NFL player name to see if they are already in the Hall of
          Fame.
        </p>

        <form onSubmit={handleSubmit} className="appForm">
          <input
            type="text"
            value={query}
            placeholder="e.g. Jerry Rice"
            onChange={(event) => setQuery(event.target.value)}
            className="appInput"
          />
          <button type="submit" className="appButton">
            Check
          </button>
        </form>

        <section
          className={[
            "appResultCard",
            hasMatch ? "appResultCard--match" : "appResultCard--miss",
          ].join(" ")}
        >
          <p className="appResultMessage">{resultMessage}</p>
          {submittedName && !hasMatch && (
            <p className="appResultHint">
              Make sure spelling is correct. Try first and last name.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
