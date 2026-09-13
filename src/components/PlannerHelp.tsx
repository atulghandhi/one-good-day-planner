import { Link } from "@tanstack/react-router";
export function PlannerHelp() {
  return (
    <section aria-labelledby="planner-help" className="mt-12 border-t border-border/70 pt-8">
      <h2 id="planner-help" className="t-display-sm">
        A free daily planner, without the sign-up
      </h2>
      <p className="mt-3 t-body text-muted-foreground">
        One Good Day is a simple online planner for choosing your most important task, keeping a
        short to-do list, and turning ideas into a manageable day. Start with your One Thing, add a
        few Shoulds, and leave Coulds for when you have room.
      </p>
      <div className="mt-6 space-y-4 t-body">
        <details>
          <summary className="cursor-pointer font-semibold">How do I plan my day?</summary>
          <p className="mt-2 text-muted-foreground">
            Choose one outcome that would make today a win. Break it into small steps, then add your
            other commitments as Shoulds and optional tasks as Coulds.{" "}
            <Link
              to="/guides/$slug"
              params={{ slug: "how-to-plan-your-day" }}
              className="underline"
            >
              See a worked daily plan.
            </Link>
          </p>
        </details>
        <details>
          <summary className="cursor-pointer font-semibold">
            Do I need an account, and where is my plan saved?
          </summary>
          <p className="mt-2 text-muted-foreground">
            No account or payment is required. Plans and reflections are saved in this browser on
            your device. Clearing browser data can remove them. There is no automatic account sync;
            use Send to Device to transfer today’s plan.
          </p>
        </details>
        <details>
          <summary className="cursor-pointer font-semibold">
            Can I brainstorm before choosing my tasks?
          </summary>
          <p className="mt-2 text-muted-foreground">
            Yes. Use the{" "}
            <Link to="/brainstorm" className="underline">
              online brainstorm canvas
            </Link>{" "}
            to map ideas and their smaller parts, then send a selected idea to your One Thing,
            Shoulds, or Coulds.
          </p>
        </details>
        <details>
          <summary className="cursor-pointer font-semibold">
            Is this an hourly schedule or a priority planner?
          </summary>
          <p className="mt-2 text-muted-foreground">
            It is a priority planner. It helps you choose what matters and start with a focus timer.
            Keep appointments and fixed time blocks in your calendar.
          </p>
        </details>
      </div>
      <Link to="/guides" className="mt-6 inline-block t-meta underline underline-offset-4">
        Explore the daily planning guides →
      </Link>
    </section>
  );
}
