import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import Page from '../app/page';
// import { NextIntlProvider } from "next-intl";

describe('Page', () => {
  it('renders the page', () => {
    // Render the page component
    render(<Page />);

    // Check presence of the main heading
    const heading = screen.getByText('Content Container');
    expect(heading).toBeInTheDocument();

    // Check for the mobile label text (visible in markup)
    const mobileLabel = screen.getByText('(Mobile)');
    expect(mobileLabel).toBeInTheDocument();

    // Check for a fragment of the lorem ipsum paragraph
    const loremSnippet = screen.getByText(/Lorem ipsum dolor sit amet/i);
    expect(loremSnippet).toBeInTheDocument();
  });
});
