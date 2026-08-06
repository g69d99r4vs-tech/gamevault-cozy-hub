# GameSphere Hub

# GameHub – AI Prompt for Loveable

## Project Overview

Build a premium personal web application called GameHub.

GameHub is not a game store and not a social network.

It is a luxurious, modern, high-performance personal gaming dashboard designed for only two users:

- فيصل

- مشعل

The goal is to manage every aspect of our gaming life in one place.

The application should feel as polished as PlayStation, Steam, Xbox Dashboard, and Apple products.

Everything should be responsive, elegant, animated, and extremely fast.

---

# General Design

Create a modern Arabic-first interface with full RTL support.

Design language:

- Minimal

- Premium

- Dark Mode by default

- Beautiful gradients

- Glassmorphism where appropriate

- Rounded cards

- Soft shadows

- Smooth animations

- Micro interactions

- Skeleton loading

- Responsive for desktop, tablet, and mobile

Use modern typography.

Every page should feel alive.

---

# Tech Stack

Use:

- React

- Next.js

- TypeScript

- Tailwind CSS

- shadcn/ui

- Framer Motion

- Recharts

- React Query

- Zustand

- Supabase (prepared for future sync)

- Local Storage backup

- RAWG API

- HowLongToBeat data (if available)

- Hijri date support

Architecture must be scalable.

---

# Users

Only two users exist:

- فيصل

- مشعل

Each user has:

- Avatar

- Bio

- Favorite Game

- Favorite Platform

- Favorite Genre

- Personal Statistics

- Achievements

- Gaming Goals

- Activity Timeline

- Game Library

Switching between users should be instant.

---

# Home Dashboard

Create a beautiful dashboard containing:

- Welcome section

- Hero Banner

- Current Game

- Last Completed Game

- Upcoming Games

- Countdown to next release

- Total Games

- Completed Games

- Current Games

- Backlog

- Wishlist

- Favorites

- Total Hours Played

- Average Rating

- Latest Activities

- Latest Achievements

- Quick Actions

- Smart Search

- Recently Added Games

Everything should update automatically.

---

# Smart Search

Integrate RAWG API.

As soon as the user types two letters:

Example:

RE

Show:

Resident Evil 2

Resident Evil 3

Resident Evil 4

Resident Evil 7

Resident Evil Village

Resident Evil Requiem

Each result must display:

- Cover

- Background

- Logo (if available)

- Release Year

- Platforms

- Genres

- Developer

- Publisher

- Rating

- Metacritic

Selecting a game should automatically import all available metadata without manual entry.

---

# Game Details Page

Every game should have a rich detail page including:

- Hero Banner

- Cover

- Gallery

- Screenshots

- Trailer

- Description

- Release Date

- Hijri Date

- Developer

- Publisher

- Platforms

- Genres

- Age Rating

- Official Website

- RAWG Rating

- Metacritic

- Playtime Estimate

- Similar Games

---

# Upcoming Games

Display upcoming releases sorted automatically by nearest release date.

Each game should include:

- Cover

- Background

- Logo

- Countdown Timer

- Release Date

- Hijri Date

- Developer

- Publisher

- Platforms

- Genres

- Description

- Screenshots

- Trailer

- Official Website

- Favorite Button

- Reminder Button

Countdown updates every second.

---

# Current Games

Each game contains:

- Progress %

- Hours Played

- Start Date

- Estimated Remaining Time

- Difficulty

- Platform

- Personal Notes

- Finish Button

---

# Completed Games

Beautiful gallery.

Each completed game stores:

- Cover

- Completion Date

- Hours Played

- Personal Rating

- Review

- Platform

- 100% Completion

- Achievement Count

- Replay Count

Support:

- Search

- Filter

- Sort

- Edit

- Delete

---

# Backlog

Games waiting to be played.

Features:

Priority:

🔥 High

⭐ Medium

🕒 Low

Estimated Completion Time

Drag & Drop ordering

---

# Favorites

Manual ordering.

Beautiful showcase.

---

# Wishlist

Store:

- Cover

- Estimated Price

- Priority

- Notes

- Added Date

---

# Game Collections

Examples:

- Horror

- Zombie

- Story Rich

- Open World

- RPG

- Shooter

- Multiplayer

- PlayStation

- Xbox

- Nintendo

- Favorites

Collections update automatically.

---

# Franchises

Support franchise tracking.

Examples:

Resident Evil

Silent Hill

GTA

God of War

Spider-Man

Batman Arkham

Assassin's Creed

Need for Speed

Battlefield

Call of Duty

Far Cry

Dead Space

BioShock

Metal Gear

Uncharted

For every franchise display:

- Every title

- Completed

- Not Completed

- Progress %

- Hours Played

---

# Statistics

Create professional charts.

Include:

- Total Games

- Completed

- Current

- Backlog

- Wishlist

- Hours Played

- Average Rating

- Games per Month

- Games per Year

- Hours per Month

- Hours per Year

- Favorite Genre

- Favorite Platform

- Favorite Developer

- Favorite Publisher

- Longest Game

- Shortest Game

- Completion Rate

- Average Games per Month

- Average Hours per Day

Use animated charts.

---

# Achievements

Create custom achievement system.

Examples:

- First Game

- First Horror Game

- First Platinum

- 100 Hours

- 500 Hours

- 1000 Hours

- 10 Games

- 25 Games

- 50 Games

- 100 Games

- Resident Evil Master

- Silent Hill Master

- Collector

- Completionist

---

# Calendar

Calendar includes:

- Upcoming Releases

- Completed Games

- Gaming Sessions

- Countdown Events

- Monthly Goals

---

# Activity Timeline

Examples:

Started Resident Evil 4

Finished Silent Hill f

Added GTA VI

Added Favorite

Unlocked Achievement

Added Backlog Game

Everything should appear chronologically.

---

# Profile

Each profile contains:

Avatar

Bio

Favorite Game

Favorite Platform

Favorite Genre

Statistics

Achievements

Timeline

Best Game

---

# Compare Users

Create comparison page between فيصل and مشعل.

Compare:

- Completed Games

- Hours Played

- Average Rating

- Favorite Genre

- Favorite Platform

- Completion Rate

- Best Franchise

- Most Active Month

Display animated charts.

---

# Goals

Support yearly goals.

Example:

Finish 30 Games

Play 600 Hours

Complete Resident Evil Series

Complete Silent Hill Series

Display progress bars.

---

# Notifications

Support reminders:

30 days before release

7 days before

1 day before

Release day

Game completed

Achievement unlocked

Goal completed

---

# Random Game Picker

Button:

Choose a Game

Randomly selects from:

- Backlog

- Current Games

- Wishlist

---

# Personal Notes

Each game includes:

Best Moment

Worst Moment

Opinion

Private Notes

---

# Gaming Sessions

Display:

Today

This Week

This Month

This Year

Hours Played

---

# Celebration Screen

When finishing a game:

Show confetti animation.

Display:

Cover

Hours Played

Rating

Achievements

Completion Date

Review

Automatically move the game to Completed Games.

---

# Browse by

Support browsing by:

Developer

Publisher

Country

Platform

Genre

Release Year

Franchise

Collection

---

# Completion Analytics

Calculate completion percentages for:

Genres

Platforms

Franchises

Years

Months

---

# Remaining Backlog Time

Calculate total estimated hours required to finish the entire backlog.

---

# Gaming Wrapped

Create annual report similar to Spotify Wrapped.

Include:

Most Played Game

Favorite Genre

Favorite Platform

Hours Played

Completed Games

Highest Rated Game

Longest Game

Shortest Game

Most Active Month

Yearly Achievements

Beautiful animated presentation.

---

# Gaming Memories

Examples:

"One year ago today you completed Resident Evil 4."

---

# Hall of Fame

Beautiful showcase for Top 10 / Top 25 / Top 50 games.

Display:

Cover

Rating

Review

Completion Date

Hours

Ranking

---

# Backup

Support:

Local Backup

Export JSON

Import JSON

Architecture ready for cloud sync later using Supabase.

---

# Performance

Application must:

- Load quickly

- Lazy load images

- Optimize API calls

- Cache RAWG responses

- Support offline viewing for local data

- Be highly maintainable

---

# UI Quality

The final result should feel like a premium commercial application.

Focus on:

- Smooth animations

- Beautiful transitions

- Consistent spacing

- Elegant cards

- Rich visuals

- High usability

- Modern dashboards

- Professional charts

- Clean information hierarchy

Avoid generic admin dashboard styling.

The application should feel like an official gaming companion app worthy of daily use.

The codebase must be production-ready, scalable, modular, and easy to extend with future features such as cloud sync, mobile app support, push notifications, and additional users.





Api is 

4ea2968a10604ee0bacd122f1ad00cee

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://gamevault-cozy-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/42a7ce53-e558-4e83-9594-815ad6141c4f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
