import { UserAvatar } from "@/components/UserAvatar";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useCurrentData, useOtherData, useStore } from "@/lib/store";
import { activityIcon } from "@/lib/stats";
import { gdate } from "@/lib/dates";
import { SectionTitle, EmptyState } from "@/components/ui-bits";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: "الخط الزمني — GameHub" },
      {
        name: "description",
        content: "كل ما حدث بينك وبين أخوك: بدايات، تختيمات، تقييمات وبلاتينيومات لحظة بلحظة.",
      },
      { property: "og:title", content: "الخط الزمني — GameHub" },
      { property: "og:description", content: "الخط الزمني المشترك لفيصل ومشعل." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TimelinePage,
});

function TimelinePage() {
  const me = useCurrentData();
  const other = useOtherData();
  const currentUser = useStore((s) => s.currentUser);

  const feed = [
    ...me.activities.map((a) => ({ ...a, who: me.profile, mine: true })),
    ...other.activities.map((a) => ({ ...a, who: other.profile, mine: false })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <div className="space-y-6">
      <SectionTitle title="الخط الزمني" subtitle="نشاطاتنا لحظة بلحظة" />
      {feed.length ? (
        <div className="relative space-y-3 pr-5">
          <span className="absolute inset-y-0 right-2 w-px bg-border" />
          {feed.slice(0, 120).map((a, i) => (
            <motion.div
              key={`${currentUser}-${a.id}`}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.4) }}
              className="relative rounded-3xl border border-border bg-card p-4"
            >
              <span className="absolute -right-[19px] top-6 grid size-4 place-items-center rounded-full border-2 border-background bg-primary" />
              <div className="flex items-start gap-3">
                <UserAvatar value={a.who.avatar} size={36} framed={false} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-bold">{a.who.name}</span> {a.text}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {activityIcon(a.type)} {gdate(a.at)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState text="لا نشاط بعد — ابدأ لعبة وسيظهر هنا فورًا." />
      )}
    </div>
  );
}
