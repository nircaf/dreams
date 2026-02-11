document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('papers-container');

    // Fetch papers from global data (loaded from papers_data.js)
    const data = window.papersData || [];
    renderPapers(data);

    // Render papers to the DOM
    function renderPapers(papers) {
        container.innerHTML = '';
        if (papers.length === 0) {
            container.innerHTML = '<p class="no-papers">No papers found.</p>';
            return;
        }

        papers.forEach(paper => {
            const card = document.createElement('div');
            card.classList.add('paper-card');

            const tagsHtml = paper.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

            card.innerHTML = `
                <div class="paper-header">
                    <span class="paper-year">${paper.year}</span>
                    <h3 class="paper-title"><a href="${paper.url}" target="_blank">${paper.title}</a></h3>
                </div>
                <div class="paper-meta">
                    <span class="paper-authors">${paper.authors}</span>
                    <span class="paper-journal">${paper.journal}</span>
                </div>
                <p class="paper-abstract"><strong>Key Findings:</strong> ${paper.abstract}</p>
                <div class="paper-tags">${tagsHtml}</div>
                <a href="${paper.url}" target="_blank" class="paper-link">Read Paper <i class="fas fa-external-link-alt"></i></a>
            `;
            container.appendChild(card);
        });
    }
});
