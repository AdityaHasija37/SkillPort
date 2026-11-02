import { Link } from "react-router-dom";

import { Empty } from "../components/ui.jsx";

export default function NotFound() {
  return (
    <div className="container page">
      <Empty title="We couldn't find that page." action={<Link to="/" className="btn btn-primary">Browse courses</Link>}>
        It may have moved, or the course may no longer be published.
      </Empty>
    </div>
  );
}
