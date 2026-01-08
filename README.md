# Traxos 💰

**Traxos** is a comprehensive personal finance tracker built to help you manage your income and expenses effortlessly. It leverages a modern tech stack for high performance and real-time data synchronization.

**🔗 Live Demo:** [https://traxos.vercel.app/](https://traxos.vercel.app/)

## ✨ Features

* **Dashboard Analytics:** Visualize your financial health with income vs. expense summaries.
* **Transaction Tracking:** Log daily earnings and spendings with ease.
* **Real-time Sync:** Powered by Supabase to keep your data updated instantly across devices.
* **Secure Authentication:** User management handled securely via Supabase Auth.
* **Responsive UI:** Designed with Tailwind CSS to look great on mobile and desktop.
* **Category Management:** Organize transactions by customizable categories.

## 🛠️ Tech Stack

* **Framework:** [React](https://reactjs.org/) (via [Vite](https://vitejs.dev/))
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) & PostCSS
* **Backend & Auth:** [Supabase](https://supabase.com/) (PostgreSQL)
* **Deployment:** [Vercel](https://vercel.com/)
* **Linting:** ESLint

## 🚀 Getting Started

Follow these steps to run the project locally.

### Prerequisites

* Node.js (v18+ recommended)
* npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/waqar741/FinTrac.git
    cd FinTrac
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory (or rename `.env.example` if it exists). Add your Supabase credentials. 
    
    *Note: Since this is a Vite project, variables must start with `VITE_`.*

    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```
    
    Access the app at `http://localhost:5173` (default Vite port).

## 🗄️ Database Setup (Supabase)

This project relies on Supabase for data storage. You will likely need:

1.  A `profiles` table (often linked to `auth.users`).
2.  A `transactions` (or `expenses`) table with columns like:
    * `id` (uuid, primary key)
    * `user_id` (foreign key to auth.users)
    * `amount` (numeric)
    * `category` (text)
    * `description` (text)
    * `date` (timestamp/date)
    * `type` (text: 'income' or 'expense')

*(Check the `supabase/migrations` folder in the repo for the exact SQL definitions.)*

## 🤝 Contributing

Contributions are welcome!
1.  Fork the project.
2.  Create your feature branch (`git checkout -b feature/NewFeature`).
3.  Commit your changes (`git commit -m 'Add NewFeature'`).
4.  Push to the branch (`git push origin feature/NewFeature`).
5.  Open a Pull Request.

## 📄 License

This project is open source. License MIT.

---

Developed by **[Waqar](https://github.com/waqar741)**
