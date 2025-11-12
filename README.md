# BridgeIT - Utility Management Platform

BridgeIT is a comprehensive utility management platform designed to streamline electricity bill processing for businesses in India's complex electricity sector. The platform offers automated bill discovery, digitization, financial delegation, payments, and analytics capabilities.

## Features

### 🔍 Bill Discovery

- Automated bill tracking from generation to fetching
- Handles multiple locations and generation dates
- API integration with 100+ Biller boards
- Automated alerts for delayed bills

### 📄 Bill Digitization

- Extracts static consumer information
- Captures dynamic billing details
- Reduces manual processing costs
- Monitors payment against consumption
- Tracks carbon sequestration

### 👥 Financial Delegation

- Built-in compliance checks
- Configurable approval matrix
- Internal compliance adherence
- Cash flow management forecasting

### 💳 Bill Payments

- Streamlined cash flow planning
- Multiple payment options
- Payment confirmation tracking
- Receipt reconciliation
- Proactive reversal handling

### 📊 Analytics

- Historical data analysis
- Performance improvement insights
- Outlier identification
- Site-specific performance metrics
- Penalty reduction strategies

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **UI Components**: Shadcn UI
- **Icons**: Lucide React
- **Styling**: CSS Modules
- **Testing**: Jest, React Testing Library
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/bridgeit.git
```

2. Install dependencies:

```bash
cd bridgeit
npm install
# or
yarn install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing

This project uses **Test-Driven Development (TDD)** practices. All tests must pass before any deployment can occur.

### Running Tests

```bash
# Run tests in watch mode (for development)
pnpm test:watch

# Run tests once
pnpm test

# Run tests with coverage report
pnpm test:coverage

# Run tests in CI mode (used during builds)
pnpm test:ci
```

### Test-Driven Development Workflow

1. **Write Tests First**: Before implementing a feature, write tests that describe the expected behavior
2. **Run Tests**: Ensure the new tests fail (Red phase)
3. **Implement Feature**: Write the minimum code needed to make tests pass (Green phase)
4. **Refactor**: Improve code quality while keeping tests passing (Refactor phase)
5. **Deploy**: Tests run automatically on Vercel before deployment

### Deployment Protection

**All deployments are blocked if tests fail.** The build process on Vercel automatically runs tests before building:

- Tests run via `pnpm test:ci` command
- If any test fails, the build fails and deployment is blocked
- Coverage reports are generated during CI builds
- Test results are visible in Vercel deployment logs

### Test Coverage

- Coverage reports are generated in the `coverage/` directory
- Coverage thresholds are configured in `jest.config.ts`
- View coverage reports: `pnpm test:coverage` and open `coverage/lcov-report/index.html`

### Writing Tests

Tests are located next to the components/pages they test:
- Component tests: `components/**/__tests__/*.test.tsx`
- Page tests: `app/**/__tests__/*.test.tsx`
- Service tests: `services/**/__tests__/*.test.ts`

Example test structure:
```typescript
import { render, screen } from '@testing-library/react';
import Component from '../component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## Project Structure

```
bridgeit/
├── components/
│   ├── ui/
│   └── landing-page.tsx
├── public/
├── styles/
├── pages/
├── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Metrics

- 1 Million+ Bills Processed
- 10 Million+ Bill Parameters Handled
- 1000+ Crore Rupees in Payments Processed

## Acknowledgments

- Thanks to all contributors who have helped shape BridgeIT
- Special thanks to our early adopters and customers
