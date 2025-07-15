// Rotated D3 Marimekko Chart Implementation with detailed segments

document.addEventListener('DOMContentLoaded', () => {
    if (typeof d3 === 'undefined') {
        console.error('D3 library not loaded!');
        return;
    }
    
    console.log('D3 version:', d3.version);
    
    // Track current view mode
    let viewMode = 'condensed'; // Start with condensed view
    
    // Create toggle button
    const container = d3.select('#visualization-container');
    const toggleBtn = container.append('div')
        .attr('class', 'toggle-container')
        .append('button')
        .attr('id', 'view-toggle')
        .attr('class', 'toggle-button')
        .text('Show Expanded View');
    
    // Load CSV data and initialize chart
    d3.csv("../data/veg_fire_matrix_eureka.csv").then(function(csvData) {
        // Initial chart creation with condensed view
        createRotatedMarimekkoChart(csvData, viewMode);
        
        // Add toggle functionality
        toggleBtn.on('click', function() {
            // Toggle view mode
            viewMode = viewMode === 'condensed' ? 'expanded' : 'condensed';
            
            // Update button text
            d3.select(this).text(viewMode === 'condensed' ? 'Show Expanded View' : 'Show Condensed View');
            
            // Clear existing visualization
            container.select('svg').remove();
            
            // Redraw with new mode
            createRotatedMarimekkoChart(csvData, viewMode);
        });
    }).catch(function(error) {
        console.error("Error loading the CSV file:", error);
    });
});

function createRotatedMarimekkoChart(csvData, mode = 'condensed') {
    function showTooltip(x, y, name, percent, hectares, severity) {
    // Remove any existing tooltips
    d3.select('#tooltip-container').remove();
        
        // Create tooltip group
        const tooltip = svg.append('g')
            .attr('id', 'tooltip-container')
            .attr('class', 'tooltip-container');
        
        // Add background rectangle
        tooltip.append('rect')
            .attr('width', 340)
            .attr('height', 200);
        
        // Text wrapping function with improved line spacing
        function wrapText(text, width, xPos, yPos, className) {
            const words = text.split(/\s+/).reverse();
            let word;
            let line = [];
            let lineNumber = 0;
            // Reduced line height to fix spacing between wrapped lines
            const lineHeight = className === 'tooltip-vegetation-name' ? 16 : 14;
            let tspan = tooltip.append('text')
                .attr('class', className)
                .attr('x', xPos)
                .attr('y', yPos)
                .append('tspan')
                .attr('x', xPos);

            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(' '));
                if (tspan.node().getComputedTextLength() > width - 10) {
                    line.pop();
                    tspan.text(line.join(' '));
                    line = [word];
                    tspan = tooltip.append('text')
                        .attr('class', className)
                        .attr('x', xPos)
                        .attr('y', yPos + (++lineNumber * lineHeight))
                        .append('tspan')
                        .attr('x', xPos)
                        .text(word);
                }
            }
            
            return lineNumber; // Return number of wrapped lines
        }
        
        // Add wrapped vegetation name text and get line count
        const vegetationNameLines = wrapText(name, 300, 15, 30, 'tooltip-vegetation-name');
        
        // Calculate base y-position for percentage based on name height
        // Base position + lines * line-height + 40px spacing
        const percentYPosition = 30 + (vegetationNameLines * 16) + 40;
        
        // Add percentage value with 40px space after name
        tooltip.append('text')
            .attr('class', 'tooltip-percentage')
            .attr('x', 15)
            .attr('y', percentYPosition)
            .text(`${percent.toFixed(1)}%`);
        
        // Add wrapped severity description 
        let description;
        if (severity === "total") {
            description = "of total burn area";
        } else {
            description = `of species burn area considered ${severity} severity`;
        }

        wrapText(description, 300, 15, percentYPosition + 25, 'tooltip-description');
        
        // Only add hectare information if it's provided (remove Total row restriction)
        if (hectares !== undefined) {
            // Add hectare value with same styling as percentage
            tooltip.append('text')
                .attr('class', 'tooltip-percentage')
                .attr('x', 15)
                .attr('y', percentYPosition + 60)
                .text(`${hectares.toFixed(1)}`);
            
            // Add hectare description
            tooltip.append('text')
                .attr('class', 'tooltip-description')
                .attr('x', 15)
                .attr('y', percentYPosition + 85)
                .text("hectares burned");
        }
        
        // Get dimensions for positioning
        const tooltipWidth = 300;
        const tooltipHeight = 200;
        const containerWidth = width;
        const containerHeight = height;
        
        // Check if cursor is in right half of container
        const isInRightHalf = x > containerWidth / 2;
        
        // Calculate position based on which half we're in
        let tooltipX;
        if (isInRightHalf) {
            // Position tooltip to the LEFT of cursor if in right half
            tooltipX = x - tooltipWidth - 10;
        } else {
            // Position tooltip to the RIGHT of cursor if in left half
            tooltipX = x + 10;
        }
        
        // Ensure tooltip stays within horizontal bounds
        tooltipX = Math.max(10, Math.min(containerWidth - tooltipWidth - 10, tooltipX));
        
        // Calculate vertical position (similar to before)
        let tooltipY = y - tooltipHeight - 10;
        
        // If tooltip would go above the container, position below cursor
        if (tooltipY < 0) {
            tooltipY = y + 10;
        }
        
        // If tooltip would go below container, adjust up
        if (tooltipY + tooltipHeight > containerHeight) {
            tooltipY = Math.max(10, containerHeight - tooltipHeight - 10);
        }
        
        // Set final position after all adjustments
        tooltip.attr('transform', `translate(${tooltipX}, ${tooltipY})`);
    }

    // Clicked View to show detailed segment information and distribution

    function showClickedView(vegetationName, rect) {
        // Remove any existing clicked view
        d3.select('#clicked-view-panel').remove();
        
        // Get visualization container dimensions
        const containerRect = container.node().getBoundingClientRect();
        const containerWidth = containerRect.width;
        
        // Create panel with 1/3 width of container
        const panelWidth = containerWidth / 3;
        const panel = container.append('div')
            .attr('id', 'clicked-view-panel')
            .style('width', `${panelWidth}px`);
             // Only width remains inline as it's dynamic
        
        // Add close button
        panel.append('div')
            .attr('class', 'panel-close')
            .text('×')
            .on('click', function() {
                d3.select('#clicked-view-panel').remove();
                // Remove highlight from selected segment
                d3.selectAll('.segment-selected')
                    .classed('segment-selected', false);
            });
        
        // Find the vegetation data for the clicked segment
        const vegData = vegetationData.find(d => d.name === vegetationName);
        
        // Exit if no data found
        if (!vegData) {
            panel.append('div')
                .attr('class', 'panel-text')
                .text('No data available for this vegetation type.');
            return;
        }
        
        // Add vegetation name heading
        panel.append('h2')
            .attr('class', 'panel-heading')
            .style('font-size', '22px') // Add this line to increase from default 18px
            .text(vegetationName);
        
        // Add vegetation overview stats
        panel.append('p')
            .attr('class', 'panel-text')
            .html(`This vegetation represents <strong>${vegData.totalPercent.toFixed(1)}%</strong> of the total fire area`);
        
        panel.append('p')
            .attr('class', 'panel-text')
            .html(`Total species area affected: <strong>${vegData.totalHa.toFixed(1)}</strong> hectares`);
        
        // ---------- VISUALIZATION 1: Severity Breakdown ----------
        
        // Add divider line before the section title (moved from below title to above)
        panel.append('hr')
            .style('border', 'none')
            .style('height', '2px')
            .style('background-color', '#333')
            .style('margin-bottom', '15px')
            .style('margin-top', '25px');
        
        // Create section heading for first chart
        panel.append('h3')
            .attr('class', 'panel-section-title')
            .text('Severity Distribution');
        
        // Reduce space between charts by changing this:
        const chartContainer = panel.append('div')
            .attr('class', 'chart-container')
            .style('margin-bottom', '30px'); // Reduced from 50px to 30px for better fit on laptop screens
        
        // Severity breakdown data
        const severityData = [
            { severity: 'High', percent: vegData.highPerc, hectares: vegData.high_ha },
            { severity: 'Moderate', percent: vegData.medPerc, hectares: vegData.moderate_ha },
            { severity: 'Low', percent: vegData.lowPerc, hectares: vegData.low_ha },
            { severity: 'Unburned', percent: vegData.unburnedPerc, hectares: vegData.unburned_ha }
        ];
        
        // Create chart container with increased bottom margin
        const chartWidth = panelWidth - 60;
        const chartHeight = 150;
        const barPadding = 0.2;
        
        const breakdownSvg = chartContainer.append('svg')
            .attr('width', chartWidth)
            .attr('height', chartHeight);
        
        // X scale for severity categories
        const xScale = d3.scaleBand()
            .domain(severityData.map(d => d.severity))
            .range([0, chartWidth])
            .padding(barPadding);
        
        // Y scale for percentages
        const yScale = d3.scaleLinear()
            .domain([0, 100])
            .range([chartHeight - 30, 0]);
        
        // Draw bars - use same vegetation color for all severity bars
        breakdownSvg.selectAll('.bar')
            .data(severityData)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d.severity))
            .attr('width', xScale.bandwidth())
            .attr('y', d => yScale(d.percent))
            .attr('height', d => chartHeight - 30 - yScale(d.percent))
            .attr('fill', vegData.color); // Use same color for all bars
        
        // Add percentage labels on top of bars
        breakdownSvg.selectAll('.bar-label')
            .data(severityData)
            .enter()
            .append('text')
            .attr('class', 'bar-label')
            .attr('x', d => xScale(d.severity) + xScale.bandwidth() / 2)
            .attr('y', d => yScale(d.percent) - 5)
            .attr('text-anchor', 'middle')
            .text(d => `${d.percent.toFixed(1)}%`);
        
        // Add x-axis labels
        breakdownSvg.selectAll('.x-label')
            .data(severityData)
            .enter()
            .append('text')
            .attr('class', 'x-label')
            .attr('x', d => xScale(d.severity) + xScale.bandwidth() / 2)
            .attr('y', chartHeight - 10)
            .attr('text-anchor', 'middle')
            .text(d => d.severity);
        
        // ---------- VISUALIZATION 2: Comparison to Average ----------
        
        // Calculate average severity distribution across all vegetation types
        const avgHighPercent = d3.sum(vegetationData, d => d.high_ha) / totalFireHectares * 100;
        const avgModeratePercent = d3.sum(vegetationData, d => d.moderate_ha) / totalFireHectares * 100;
        const avgLowPercent = d3.sum(vegetationData, d => d.low_ha) / totalFireHectares * 100;
        const avgUnburnedPercent = d3.sum(vegetationData, d => d.unburned_ha) / totalFireHectares * 100;
        
        // Create comparison data
        const comparisonData = [
            { severity: 'High', veg: vegData.highPerc, avg: avgHighPercent },
            { severity: 'Moderate', veg: vegData.medPerc, avg: avgModeratePercent },
            { severity: 'Low', veg: vegData.lowPerc, avg: avgLowPercent },
            { severity: 'Unburned', veg: vegData.unburnedPerc, avg: avgUnburnedPercent }
        ];
        
        // Create section heading
        panel.append('h3')
            .attr('class', 'panel-section-title')
            .text('Comparison to Fire Average');
        
        // Create container for second chart
        const compChartContainer = panel.append('div')
            .attr('class', 'chart-container');
        
        // Create SVG for comparison chart
        const compChartWidth = panelWidth - 60;
        const compChartHeight = 180;
        const groupPadding = 0.1;
        const subPadding = 0.05; // Changed back from 0.3 to original 0.05 value
        
        const comparisonSvg = compChartContainer.append('svg')
            .attr('width', compChartWidth)
            .attr('height', compChartHeight + 40);
        
        // X scale for severity categories
        const compXScale = d3.scaleBand()
            .domain(comparisonData.map(d => d.severity))
            .range([0, compChartWidth])
            .padding(groupPadding);
        
        // Sub-scale for grouped bars
        const subXScale = d3.scaleBand()
            .domain(['veg', 'avg'])
            .range([0, compXScale.bandwidth()])
            .padding(subPadding);
        
        // Y scale for percentages
        const compYScale = d3.scaleLinear()
            .domain([0, d3.max(comparisonData, d => Math.max(d.veg, d.avg)) * 1.1])
            .range([compChartHeight - 30, 0]);
        
        // Create groups for each severity
        const groups = comparisonSvg.selectAll('.group')
            .data(comparisonData)
            .enter()
            .append('g')
            .attr('class', 'group')
            .attr('transform', d => `translate(${compXScale(d.severity)},0)`);
        
        // Draw bars for vegetation
        groups.append('rect')
            .attr('x', subXScale('veg'))
            .attr('width', subXScale.bandwidth())
            .attr('y', d => compYScale(d.veg))
            .attr('height', d => compChartHeight - 30 - compYScale(d.veg))
            .attr('fill', vegData.color);
        
        // Draw bars for average - make them black instead of gray
        groups.append('rect')
            .attr('x', subXScale('avg'))
            .attr('width', subXScale.bandwidth())
            .attr('y', d => compYScale(d.avg))
            .attr('height', d => compChartHeight - 30 - compYScale(d.avg))
            .attr('fill', '#BCBABA'); // Changed from #000000 to #BCBABA
        
        // Add percentage labels for vegetation
        groups.append('text')
            .attr('class', 'bar-label')
            .attr('x', subXScale('veg') + subXScale.bandwidth() / 2)
            .attr('y', d => compYScale(d.veg) - 5)
            .attr('text-anchor', 'middle')
            .text(d => `${d.veg.toFixed(1)}%`);
        
        // Add percentage labels for average
        groups.append('text')
            .attr('class', 'bar-label')
            .attr('x', subXScale('avg') + subXScale.bandwidth() / 2)
            .attr('y', d => compYScale(d.avg) - 5)
            .attr('text-anchor', 'middle')
            .text(d => `${d.avg.toFixed(1)}%`);
        
        // Add x-axis labels
        comparisonSvg.selectAll('.comp-x-label')
            .data(comparisonData)
            .enter()
            .append('text')
            .attr('class', 'comp-x-label')
            .attr('x', d => compXScale(d.severity) + compXScale.bandwidth() / 2)
            .attr('y', compChartHeight - 10)
            .attr('text-anchor', 'middle')
            .text(d => d.severity);
        
        // Add legend
        const legend = comparisonSvg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${compXScale('High')}, ${compChartHeight + 16})`); // Changed from compChartHeight - 13 to compChartHeight + 10
        
        // Legend item for this vegetation
        legend.append('rect')
            .attr('x', 0)
            .attr('width', 10)
            .attr('height', 10)
            .attr('fill', vegData.color);

        legend.append('text')
            .attr('class', 'legend-item')
            .attr('x', 15)
            .attr('y', 10)
            .text(vegetationName); // Use actual vegetation name instead of "This vegetation"
    
        // Legend item for average - position below first item
        legend.append('rect')
            .attr('x', 0)
            .attr('y', 20) // Position below first legend item
            .attr('width', 10)
            .attr('height', 10)
            .attr('fill', '#BCBABA'); // Changed from #000000 to #BCBABA
    
        legend.append('text')
            .attr('class', 'legend-item')
            .attr('x', 15)
            .attr('y', 30) // Position text for second item
            .text('Fire average');
        
        // Add click outside handler to close panel
        d3.select('body').on('click.panelClose', function(event) {
            if (event.target.id !== 'clicked-view-panel' && 
                !panel.node().contains(event.target)) {
                
                d3.select('#clicked-view-panel').remove();
                d3.select('body').on('click.panelClose', null); // Remove event listener
                
                // Remove highlight from selected segment
                d3.selectAll('.segment-selected')
                    .classed('segment-selected', false);
            }
        });
        
        // Highlight the clicked segment
        d3.select(rect)
            .classed('segment-selected', true);
        
        // Stop event propagation to prevent immediate panel closing
        panel.on('click', function(event) {
            event.stopPropagation();
        });
    }

    // Get the container dimensions
    const container = d3.select('#visualization-container');
    const margin = {top: 40, right: 40, bottom: 250, left: 100}; // Increased bottom margin for legend
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = container.node().getBoundingClientRect().height - margin.top - margin.bottom;
    
    // Transform CSV data to the format needed for the visualization
    const vegetationData = csvData.map(d => ({
        name: d.vegetation_classification,
        totalPercent: +d.total_percent,
        highPerc: +d.high_percent,
        medPerc: +d.moderate_percent,
        lowPerc: +d.low_percent,
        unburnedPerc: +d.unburned_percent,
        totalHa: +d.total_ha,
        high_ha: +d.high_ha,
        moderate_ha: +d.moderate_ha,
        low_ha: +d.low_ha,
        unburned_ha: +d.unburned_ha,
    
        color: d.color
    }));
    
    // Calculate total fire hectares here, once
    const totalFireHectares = d3.sum(vegetationData, d => d.totalHa);
    
    // Create data structure for the chart
    const data = [
        {
            category: "Total",
            total: 200, // Increased from 100px to 140px
            y: 0,       // Starting at 0
            segments: vegetationData.map((d, i) => ({
                name: d.name, 
                totalPercent: d.totalPercent,
                totalHa: d.totalHa,
                color: d.color
            }))
        },
        {
            category: "High",
            total: 200, // Increased from 100px to 140px
            y: 300,     // Position after Total row + 60px gap (adjusted for new height)
            segments: vegetationData.map((d, i) => ({
                name: d.name,
                totalPercent: d.totalPercent,
                subSegments: [
                    { name: `${d.name} (Unburned)`, percent: d.unburnedPerc, hectares: d.unburned_ha, color: d.color, opacity: 0.3 },
                    { name: `${d.name} (Low)`, percent: d.lowPerc, hectares: d.low_ha, color: d.color, opacity: 0.3 },
                    { name: `${d.name} (Moderate)`, percent: d.medPerc, hectares: d.moderate_ha, color: d.color, opacity: 0.3 },
                    { name: `${d.name} (High)`, percent: d.highPerc, hectares: d.high_ha, color: d.color, opacity: 1.0 }
                ],
                color: d.color
            }))
        },
        {
            category: "Moderate",
            total: 200, // Increased from 100px to 140px
            y: 400,     // Position after High row (adjusted for new height)
            segments: vegetationData.map((d, i) => ({
                name: d.name,
                totalPercent: d.totalPercent,
                subSegments: [
                    { name: `${d.name} (Unburned)`, percent: d.unburnedPerc, hectares: d.unburned_ha, color: d.color, opacity: 0.3 },
                    { name: `${d.name} (Low)`, percent: d.lowPerc, hectares: d.low_ha, color: d.color, opacity: 0.3 },
                    { name: `${d.name} (Moderate)`, percent: d.medPerc, hectares: d.moderate_ha, color: d.color, opacity: 1.0 },
                    { name: `${d.name} (High)`, percent: d.highPerc, hectares: d.high_ha, color: d.color, opacity: 0.3 }
                ],
                color: d.color
            }))
        },
        {
            category: "Low",
            total: 200, // Increased from 100px to 140px
            y: 500,     // Position after Moderate row (adjusted for new height)
            segments: vegetationData.map((d, i) => ({
                name: d.name,
                totalPercent: d.totalPercent,
                subSegments: [
                    { name: `${d.name} (Unburned)`, percent: d.unburnedPerc, hectares: d.unburned_ha, color: d.color, opacity: 0.3 },
                    { name: `${d.name} (Low)`, percent: d.lowPerc, hectares: d.low_ha, color: d.color, opacity: 1.0 },
                    { name: `${d.name} (Moderate)`, percent: d.medPerc, hectares: d.moderate_ha, color: d.color, opacity: 0.3 },
                    { name: `${d.name} (High)`, percent: d.highPerc, hectares: d.high_ha, color: d.color, opacity: 0.3 }
                ],
                color: d.color
            }))
        },
        {
            category: "Unburned",
            total: 200,
            y: 600,
            segments: vegetationData.map(d => ({
                name: d.name,
                totalPercent: d.totalPercent,
                subSegments: [
                    { name: `${d.name} (Unburned)`, percent: d.unburnedPerc, hectares: d.unburned_ha, color: d.color, opacity: 1.0 },
                    { name: `${d.name} (Low)`, percent: d.lowPerc, hectares: d.low_ha, color: d.color, opacity: 0.3 },
                    { name: `${d.name} (Moderate)`, percent: d.medPerc, hectares: d.moderate_ha, color: d.color, opacity: 0.3 },
                    { name: `${d.name} (High)`, percent: d.highPerc, hectares: d.high_ha, color: d.color, opacity: 0.3 }
                ],
                color: d.color
            }))
        }
    ];

    // Process data to calculate cumulative positions
    const totalHeight = d3.sum(data, d => d.total) + 60;
    let yPosition = 0;

    data.forEach((category, index) => {
        // Calculate cumulative Y positions
        category.y = yPosition;
        yPosition += category.total;
        
        // Add 60px of space after the "Total" row 
        if (index === 0) {
            yPosition += 60;
        }
        
        // Calculate percentage width for each segment
        let xPosition = 0;
        
        if (category.category === "Total") {
            const categoryTotal = d3.sum(category.segments, d => d.totalPercent);
            
            category.segments.forEach(segment => {
                segment.x0 = xPosition / categoryTotal;
                xPosition += segment.totalPercent;
                segment.x1 = xPosition / categoryTotal;
            });
        } else {
            // For other categories, use the same width pattern as Total
            const totalSegments = data[0].segments;
            category.segments.forEach((segment, i) => {
                segment.x0 = totalSegments[i].x0;
                segment.x1 = totalSegments[i].x1;
            });
        }
    });


    // Create SVG
    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Y scale for category heights
    const yScale = d3.scaleLinear()
        .domain([0, totalHeight])
        .range([0, height]);

    // Draw rectangles for each segment in each category
    data.forEach(category => {
        // For the Total row segments
        if (category.category === "Total") {
            // Keep original widths and add 1px gaps by adjusting x-positions
            let adjustedXPosition = 0;
            
            category.segments.forEach((segment, i) => {
                // Calculate the ORIGINAL width based strictly on data
                const segmentWidth = (segment.x1 - segment.x0) * width;
                
                svg.append('rect')
                    .attr('y', yScale(category.y))
                    .attr('x', adjustedXPosition) // Use adjusted position that includes gaps
                    .attr('height', yScale(category.total))
                    .attr('width', segmentWidth) // Keep original width based on data
                    .attr('fill', segment.color)
                    .attr('stroke', 'none')
                    .attr('stroke-width', 10)
                    .on('click', function(event) {
                        event.stopPropagation(); // Prevent panel from closing immediately
                        showClickedView(segment.name, this);
                    })
                    .on('mouseover', function(event) {
                        d3.select(this)
                            .attr('opacity', 0.8)
                            .style("stroke-width", 2)
                            .style("stroke", "black");
                        
                        const [mouseX, mouseY] = d3.pointer(event);
                        
                        showTooltip(
                            mouseX, 
                            mouseY, 
                            segment.name, 
                            segment.totalPercent,
                            segment.totalHa,
                            "total"
                        );
                    })
                    .on('mouseout', function() {
                        d3.select(this)
                            .attr('opacity', 1)
                            .style('stroke', 'none');
                        
                        d3.select('#tooltip-container').remove();
                    });
                
                // Update position for next segment, adding the gap
                adjustedXPosition += segmentWidth + 1; // Add 1px gap
            });
        } else if (mode === 'condensed') {
            // For condensed view
            // Collect active segments with their original widths
            const activeSegments = [];
            let totalRowPercent = 0; // Track total percent for this row
            
            category.segments.forEach(segment => {
                const activeSubSegment = segment.subSegments.find(s => s.opacity === 1.0);
                
                if (activeSubSegment) {
                    const segmentWidth = (segment.x1 - segment.x0) * width;
                    const subWidth = (activeSubSegment.percent / d3.sum(segment.subSegments, d => d.percent)) * segmentWidth;
                    
                    // Add to the total row percentage
                    totalRowPercent += activeSubSegment.percent;
                    
                    activeSegments.push({
                        name: segment.name,
                        width: subWidth,
                        color: activeSubSegment.color,
                        percent: activeSubSegment.percent,
                        hectares: activeSubSegment.hectares
                    });
                }
            });
            
            // Draw segments with adjusted positions to create gaps
            let adjustedXPosition = 0;
            
            activeSegments.forEach((segment, i) => {
                svg.append('rect')
                    .attr('y', yScale(category.y))
                    .attr('x', adjustedXPosition) // Use adjusted position
                    .attr('height', yScale(category.total))
                    .attr('width', segment.width) // Keep original width
                    .attr('fill', segment.color)
                    .attr('stroke', 'none')
                    .attr('stroke-width', 1)
                    .on('click', function(event) {
                        event.stopPropagation(); // Prevent panel from closing immediately
                        showClickedView(segment.name, this);
                    })
                    .on('mouseover', function(event) {
                        // ...existing mouseover code...
                        d3.select(this)
                            .attr('opacity', 0.8)
                            .style("stroke-width", 2)
                            .style("stroke", "black");
                        
                        const [mouseX, mouseY] = d3.pointer(event);
                        let severity = category.category.toLowerCase();
                        
                        showTooltip(
                            mouseX, 
                            mouseY, 
                            segment.name, 
                            segment.percent,
                            segment.hectares,
                            severity
                        );
                    })
                    .on('mouseout', function() {
                        // Reset opacity
                        d3.select(this)
                            .attr('opacity', 1)
                            .style('stroke', 'none');
                        
                        d3.select('#tooltip-container').remove();
                    });
                
                // Update position for next segment, adding the gap
                adjustedXPosition += segment.width + 1; // Add 1px gap
            });
            
            // After drawing all segments, add the summary percentage
            if (category.category !== "Total") {
                // Calculate hectares for this severity class across all vegetation types
                let severityFieldName;
                switch(category.category) {
                    case "High": severityFieldName = 'high_ha'; break;
                    case "Moderate": severityFieldName = 'moderate_ha'; break;
                    case "Low": severityFieldName = 'low_ha'; break;
                    case "Unburned": severityFieldName = 'unburned_ha'; break;
                }
                
                // Sum hectares for this severity class across all vegetation types
                const severityHectares = d3.sum(vegetationData, d => d[severityFieldName]);
                
                // Calculate what percentage of TOTAL fire this severity represents
                const percentOfTotalFire = (severityHectares / totalFireHectares) * 100;
                
                svg.append('text')
                    .attr('y', yScale(category.y) + yScale(category.total) / 2)
                    .attr('x', width - 60)
                    .attr('text-anchor', 'end')
                    .attr('dominant-baseline', 'middle')
                    .attr('class', 'category-label')
                    .style('pointer-events', 'none')
                    .text(`${percentOfTotalFire.toFixed(1)}%`);
            }
        } else {
            // For expanded view
            // Start with adjustedXPosition for the entire row to track gaps properly
            let rowXPosition = 0; // Initialize position tracker for the whole row
            
            category.segments.forEach((segment, segIndex) => {
                const totalSubPercent = d3.sum(segment.subSegments, d => d.percent);
                const segmentWidth = (segment.x1 - segment.x0) * width;
                
                // Use tracked row position instead of segment.x0 * width
                let xOffset = rowXPosition;
                
                segment.subSegments.forEach((subSegment, i) => {
                    // Calculate original width based on data
                    const subWidth = (subSegment.percent / totalSubPercent) * segmentWidth;
                    
                    svg.append('rect')
                        .attr('y', yScale(category.y))
                        .attr('x', xOffset) // Use tracked position
                        .attr('height', yScale(category.total))
                        .attr('width', subWidth) // Keep original width
                        .attr('fill', subSegment.color)
                        .attr('opacity', subSegment.opacity)
                        .attr('stroke', 'none')
                        .attr('stroke-width', 1)
                        .on('click', function(event) {
                            // Only show panel for opacity 1.0 segments
                            if (subSegment.opacity === 1.0) {
                                event.stopPropagation();
                                showClickedView(segment.name, this);
                            }
                        })
                        .on('mouseover', function(event) {
                            // ...existing mouseover code...
                            if (subSegment.opacity === 1.0) {
                                d3.select(this)
                                    .attr('opacity', 0.8)
                                    .style("stroke-width", 2)
                                    .style("stroke", "black");
                                
                                const [mouseX, mouseY] = d3.pointer(event);
                                let severity = category.category.toLowerCase();
                                
                                showTooltip(
                                    mouseX, 
                                    mouseY, 
                                    segment.name, 
                                    subSegment.percent,
                                    subSegment.hectares,
                                    severity
                                );
                            }
                        })
                        .on('mouseout', function() {
                            // Reset to original opacity
                            if (subSegment.opacity === 1.0) {
                                d3.select(this)
                                    .attr('opacity', 1.0)
                                    .style('stroke', 'none');
                            }
                            
                            d3.select('#tooltip-container').remove();
                        });
                    
                    // Update position for next sub-segment WITHOUT adding a gap
                    xOffset += subWidth; // No gap between sub-segments of same vegetation
                });
                
                // Only add 1px gap AFTER completing all sub-segments for a vegetation type
                // But don't add gap after the last vegetation type
                if (segIndex < category.segments.length - 1) {
                    rowXPosition = xOffset + 1; // Add 1px gap between vegetation types
                } else {
                    rowXPosition = xOffset; // No gap after last vegetation type
                }
            });
        }
    });

    // After drawing all the category segments, but before adding labels and lines
    // Calculate the actual total width including gaps
    let actualTotalWidth = 0;

    // Get the total width from the Total row (including gaps)
    if (data[0].segments.length > 0) {
        // Calculate width of Total row including all gaps
        const totalSegments = data[0].segments;
        actualTotalWidth = d3.sum(totalSegments, d => (d.x1 - d.x0) * width) 
            + (totalSegments.length - 1); // Add 1px for each gap (except after last segment)
    } else {
        actualTotalWidth = width; // Fallback to original width
    }

    // Replace the lineEndX definition with:
    const lineEndX = actualTotalWidth;   // End at the actual right edge with gaps

    // Then use this lineEndX variable for all horizontal lines
    // Add category labels and thresholds on the y-axis
    data.forEach(category => {
        // Main category label
        svg.append('text')
            .attr('y', yScale(category.y) + yScale(category.total) / 2)
            .attr('x', -80)
            .attr('text-anchor', 'start')
            .attr('dominant-baseline', 'middle')
            .attr('class', 'category-label')
            .text(category.category);
        
        // Add threshold text under each category name (except Total)
        if (category.category !== "Total") {
            let thresholdText = "";
            
            switch(category.category) {
                case "High":
                    thresholdText = "0.7 - 1";
                    break;
                case "Moderate":
                    thresholdText = "0.4 - 0.7";
                    break;
                case "Low":
                    thresholdText = "0 - 0.3";
                    break;
                case "Unburned":
                    thresholdText = "<0";
                    break;
            }
            
            svg.append('text')
                .attr('y', yScale(category.y) + yScale(category.total) / 2 + 20) // Position below category name
                .attr('x', -80)
                .attr('text-anchor', 'start')
                .attr('dominant-baseline', 'middle')
                .attr('class', 'threshold-label')
                .text(thresholdText);
        }
    });
    
    // Add horizontal lines
    // Get positions for the rows
    const highRowTop = yScale(data[1].y);  // Top of High row
    const highRowBottom = yScale(data[1].y + data[1].total);  // Bottom of High row
    const moderateRowBottom = yScale(data[2].y + data[2].total);  // Bottom of Moderate row
    const lowRowBottom = yScale(data[3].y + data[3].total);  // Bottom of Low row
    const unburnedRowBottom = yScale(data[4].y + data[4].total);  // Bottom of Unburned row

    // Draw the 4 horizontal lines
    const lineStartX = -100;  // Start lines from left of the labels

    // Line 1: Above High row
    svg.append('line')
        .attr('x1', lineStartX)
        .attr('y1', highRowTop)
        .attr('x2', lineEndX)
        .attr('y2', highRowTop)
        .attr('stroke', 'black')
        .attr('stroke-width', 1);

    // Line 2: Below High row
    svg.append('line')
        .attr('x1', lineStartX)
        .attr('y1', highRowBottom)
        .attr('x2', lineEndX)
        .attr('y2', highRowBottom)
        .attr('stroke', 'black')
        .attr('stroke-width', 1);

    // Line 3: Below Moderate row
    svg.append('line')
        .attr('x1', lineStartX)
        .attr('y1', moderateRowBottom)
        .attr('x2', lineEndX)
        .attr('y2', moderateRowBottom)
        .attr('stroke', 'black')
        .attr('stroke-width', 1);

    // Line 4: Below Low row
    svg.append('line')
        .attr('x1', lineStartX)
        .attr('y1', lowRowBottom)
        .attr('x2', lineEndX)
        .attr('y2', lowRowBottom)
        .attr('stroke', 'black')
        .attr('stroke-width', 1);

    // Line 5: Below Unburned row
    svg.append('line')
        .attr('x1', lineStartX)
        .attr('y1', unburnedRowBottom)
        .attr('x2', lineEndX)
        .attr('y2', unburnedRowBottom)
        .attr('stroke', 'black')
        .attr('stroke-width', 1);

    // Add stacked legend at the bottom with 4 items per column
    const legendItems = vegetationData.map(d => d.name);
    const itemsPerColumn = 8;
    const columnWidth = 500; // Width between columns - adjust as needed

    const legend = svg.append('g')
        .attr('transform', `translate(0, ${height + 60})`);
    
    // Title for the legend
    legend.append('text')
        .attr('x', 0)
        .attr('y', -5)
        .attr('text-anchor', 'start')
        .style('font-weight', 'bold')
        .style('font-size', '12px')
        .text('Vegetation:');
    
    // Create legend items in columns of 4
    legendItems.forEach((item, i) => {
        const color = vegetationData.find(d => d.name === item).color;
        const columnIndex = Math.floor(i / itemsPerColumn);
        const rowIndex = i % itemsPerColumn;
        
        legend.append('rect')
            .attr('x', columnIndex * columnWidth)
            .attr('y', rowIndex * 20 + 5)
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', color);
        
        legend.append('text')
            .attr('x', columnIndex * columnWidth + 25)
            .attr('y', rowIndex * 20 + 17)
            .style('font-size', '12px')
            .text(item);
    });
}

// Updated legend creation code using CSS classes
function createLegend(svg, data, width, height) {
    // Get unique vegetation types for legend
    const legendItems = data[0].segments.map(d => d.name);
    
    // Calculate legend layout
    const itemsPerColumn = Math.min(4, legendItems.length);
    const columnWidth = Math.min(200, width / Math.ceil(legendItems.length / itemsPerColumn));
    
    // Create legend group
    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(0, ${height + 40})`);
    
    // Add legend title
    legend.append('text')
        .attr('class', 'legend-title')
        .attr('x', 0)
        .attr('y', -5)
        .text('Vegetation Types:');
    
    // Add legend items
    legendItems.forEach((item, i) => {
        const color = data[0].segments.find(d => d.name === item).color;
        const column = Math.floor(i / itemsPerColumn);
        const row = i % itemsPerColumn;
        
        // Add color box
        legend.append('rect')
            .attr('x', column * columnWidth)
            .attr('y', row * 20 + 5)
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', color);
        
        // Add text label
        legend.append('text')
            .attr('class', 'legend-item')
            .attr('x', column * columnWidth + 20)
            .attr('y', row * 20 + 18)
            .text(item);
    });
}