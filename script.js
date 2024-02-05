// Define constants
const WIDTH = 960;
const HEIGHT = 600;
const EDUCATION_DATA_URL = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";
const COUNTY_DATA_URL = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";
const COLOR_SCALE_RANGE = d3.schemeBlues[9];

// Fetch data asynchronously
async function fetchData() {
  try {
    const [countyData, educationData] = await Promise.all([
      d3.json(COUNTY_DATA_URL),
      d3.json(EDUCATION_DATA_URL)
    ]);
    return { countyData, educationData }; // Recieved Data
  } catch (error) {
    throw new Error("Error fetching data:", error);
  }
}

// Draw choropleth map
function drawChoroplethMap(countyData, educationData) {
  // Append SVG
  const svg = d3.select("#choropleth-container")
    .append("svg")
    .attr("width", WIDTH)
    .attr("height", HEIGHT);

  // Define color scale
  const colorScale = d3.scaleThreshold()
    .domain([0, 10, 20, 30, 40, 50, 60, 70, 80])
    .range(COLOR_SCALE_RANGE);

  // Draw counties
  svg.selectAll("path")
    .data(topojson.feature(countyData, countyData.objects.counties).features)
    .enter()
    .append("path")
    .attr("class", "county")
    .attr("data-fips", d => d.id)
    .attr("data-education", d => {
      const county = educationData.find(item => item.fips === d.id);
      return county ? county.bachelorsOrHigher : 0;
    })
    .attr("fill", d => {
      const county = educationData.find(item => item.fips === d.id);
      return county ? colorScale(county.bachelorsOrHigher) : colorScale(0);
    })
    .attr("d", d3.geoPath())
    .on("mouseover", (event, d) => {
      const county = educationData.find(item => item.fips === d.id);
      d3.select("#tooltip")
        .style("opacity", 1)
        .style("left", `${event.pageX}px`)
        .style("top", `${event.pageY}px`)
        .attr("data-education", county ? county.bachelorsOrHigher : 0)
        .html(`<strong>${county ? county.area_name : "Unknown"}</strong><br>Education Level: ${county ? county.bachelorsOrHigher + "%" : "N/A"}`);
    })
    .on("mouseout", () => {
      d3.select("#tooltip").style("opacity", 0);
    });

  // Create legend
  const legend = d3.select("#legend")
    .append("svg")
    .attr("width", 300)
    .attr("height", 40);

  const maxEducationLevel = d3.max(educationData, d => d.bachelorsOrHigher);

const legendScale = d3.scaleLinear()
    .domain([0, maxEducationLevel])
    .range([0, 200]);

  const legendAxis = d3.axisBottom(legendScale)
    .tickValues([10, 20, 30, 40, 50, 60, 70, 80])
    .tickFormat(d => `${d}%`);

  legend.append("g")
    .attr("transform", "translate(0, 20)")
    .call(legendAxis)
    .select(".domain")
    .remove();

  legend.selectAll("rect")
    .data(colorScale.range().map(color => {
      const d = colorScale.invertExtent(color);
      if (d[0] == null) d[0] = legendScale.domain()[0];
      if (d[1] == null) d[1] = legendScale.domain()[1];
      return d;
    }))
    .enter()
    .append("rect")
    .attr("height", 8)
    .attr("x", d => legendScale(d[0]))
    .attr("y", 15)
    .attr("width", d => legendScale(d[1]) - legendScale(d[0]))
    .attr("fill", d => colorScale(d[0]));

  // Append legend title
  legend.append("text")
    .attr("x", 0)
    .attr("y", 10)
    .text("Education Level (%)")
    .style("font-size", "12px");
}

// Main function
async function main() {
  try {
    const { countyData, educationData } = await fetchData();
    drawChoroplethMap(countyData, educationData);
  } catch (error) {
    console.error(error);
  }
}

// Call main function
main();
