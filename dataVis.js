async function fetchData() {
  // load wide format data
  const wideData = await d3.csv("./dataset/videogames_wide.csv");
  // load long format data
  const longData = await d3.csv("./dataset/videogames_long.csv");
  return { wideData, longData };
}

fetchData().then(async ({ wideData, longData }) => {
  
 // view 1: heat map: Genre vs Platform (Global Sales)
 // Which specific platform-genre combinations 
 // represent the highest revenue, and which genre demonstrates the most consistent dominance?

  const vlSpec = vl
    .markRect()
    .data(wideData)
    // aggregate to get total sales by Genre and Platform
    .transform(
      {
        aggregate: [{op: "sum", field: "Global_Sales", as: "total_sales"}],
        groupby: ["Genre", "Platform"]
      }
    )
    .encode(
     vl.x().fieldN("Platform").title("Platform"),
      vl.y().fieldN("Genre").title("Genre"),
      vl.color().fieldQ("total_sales").title("Global Sales"), 
      
    vl.tooltip([
        vl.fieldN("Genre"), // 
        vl.fieldN("Platform"),
        {
          field: "total_sales",     // numeric field for tooltip
          type: "quantitative",     // specify type for proper formatting
          format: ".2f",            // format to 2 decimal places
          title: "Total Sales (M)"  // tooltip title
        }
      ])
    )
    .title("Global Sales by Genre and Platform")
    .width("container")
    .height(400)
    .toSpec();


//View 2: Interactive Bar Chart 
// Which video game genre has achieved the highest total global sales, 
// and how does it compare to the lowest-selling genre?
  
  // View 2: Interactive Bar Chart (Horizontal)
const genreSelect = vl.selectPoint('genreSelect')
  .fields('Genre')    // choice based on Genre
  .bind('legend');    // link selection to legend 

const vlSpec2 = vl
  .markBar()
  .data(wideData)
  .transform(
    // group by Genre and sum sales for the bar length
    vl.aggregate(
      [{op: "sum", field: "Global_Sales", as: "total_sales"}]
    ).groupby(["Genre"]) 
  )
  .params(genreSelect) 
  .encode(
    // x axis: Total Sales (Quantitative)
    vl.x().fieldQ("total_sales")
      .title("Global Sales (Millions)"),

    // y axis: Genre (Nominal), sorted by sales on x
    vl.y().fieldN("Genre")
      .sort("-x") // Sort descending by the X-axis value
      .title("Genre"),

    // color: one color per genre
    vl.color().fieldN("Genre")
      .title("Genre")
      .scale({scheme: "tableau20"}),

    // highlight selected genre, fade others
    vl.opacity()
      .condition({param: "genreSelect", value: 1})
      .value(0.1),

    // Tooltip
    vl.tooltip([
      vl.fieldN("Genre"),
      {field: "total_sales", format: ".2f", title: "Sales (M)"}
    ])
  )
  .title("Global Sales by Genre")
  .width("container")
  .height(400)
  .toSpec();
//View 3 multi-series line chart: Sales Trends by Platform 
//Which major platform experienced the longest period of sustained sales, 
// and which reached the highest peak before a rapid decline?

const platformHover = vl.selectPoint('platformHover')
    .fields('Platform') // Trigger when hovering over the line itself
    .on('pointerover') // trigger on hover
    .clear('pointerout') 
    .bind('legend');

  const lineSpec = vl
    .markLine({
      interpolate: 'monotone',
      point: false // no points, just smooth lines
    })
    .data(wideData)
    .transform(
      vl.filter("datum.Year > 0"),

      // Lifetime Sales
      //joinaggregate calculates the total sales for each platform across all years, creating a new field 'platform_lifetime_sales'
      vl.joinaggregate([
        {op: "sum", field: "Global_Sales", as: "platform_lifetime_sales"}
      ]).groupby(["Platform"]),

      // filter out platforms with low lifetime sales under 280M to reduce clutter 
      vl.filter("datum.platform_lifetime_sales > 280"),

      // aggregate for the line chart: sum sales by Year and Platform
      vl.aggregate(
        [{op: "sum", field: "Global_Sales", as: "total_sales"}]
      ).groupby(["Year", "Platform"]),

      // filter out years with zero sales to avoid flat lines at the bottom
      vl.filter("datum.total_sales > 1")
    )
    .params(platformHover) // add the hover interaction
    .encode(
      vl.x().fieldQ("Year")   // x axis: Year
        .scale({ zero: false }) // start x axis at first year with sales, not zero
        .axis({ format: "d", title: "Release Year" }), // format x axis as integers

      vl.y().fieldQ("total_sales")
        .title("Total Sales (Millions)"),

      vl.color().fieldN("Platform").title("Platform"),
      
      // Interaction Styling:
      vl.opacity().condition({param: "platformHover", value: 1}).value(0.1), // fade non-hovered lines
      vl.strokeWidth().condition({param: "platformHover", empty: false, value: 3}).value(2), // thicken hovered line
      vl.order().condition({param: "platformHover", value: 1}).value(0), // bring hovered line to front

      vl.tooltip([
        vl.fieldN("Platform"),
        vl.fieldQ("Year"),
        {field: "total_sales", format: ".2f", title: "Sales (M)"} // 2decimal places in tooltip
      ])
    )
    .title("Sales Trends by Major Platform (>280M Lifetime Sales)")
    .width("container")
    .height(400)
    .toSpec();

// View 4 Line Chart: Sales Trends of Top 5 Genres 
// Between 2000 and 2016, which genre exhibited the spike and drop, and which remained stable?
  
const genreHighlight = vl.selectPoint('genreHighlight') 
    .fields('Genre')
    .bind('legend')      // Interactive Legend
    .on('mouseover')     // Trigger on hover
    .clear('mouseout');  // Clear when mouse leaves

  const top8GenreSpec = vl
    .markLine({
      interpolate: 'monotone',
      strokeWidth: 3, // Base thickness
      point: true     // Show points for better hover targeting
    }) 
    .data(wideData)
    .transform(
      // Filter Year >= 2000 to focus on modern trends and reduce clutter
      vl.filter("datum.Year >= 2000 && datum.Year <= 2016"),

      // Calculate Total Sales per Genre
      vl.joinaggregate([
        {op: "sum", field: "Global_Sales", as: "genre_total_sales"}
      ]).groupby(["Genre"]),

      //  Rank and Filter Top 5
      vl.window([
        {op: "dense_rank", field: "genre_total_sales", as: "rank"} // Rank genres by total sales
      ]).sort([
        {field: "genre_total_sales", order: "descending"}
      ]), 
      vl.filter("datum.rank <= 5"), // Keep only top 5 genres

      // Aggregate sum sales by Year and Genre 
      vl.aggregate(
        [{op: "sum", field: "Global_Sales", as: "total_sales"}]
      ).groupby(["Year", "Genre"])
    )
    .params(genreHighlight)
    .encode(
      // X & Y Axis
      vl.x().fieldQ("Year")
        .scale({ zero: false })
        .axis({ format: "d", title: "Year" }), 
      
      vl.y().fieldQ("total_sales") 
        .title("Global Sales (Millions)"),

      // Color
      vl.color().fieldN("Genre")
        .title("Genre")
        .sort({field: "total_sales", op: "sum", order: "descending"})
        .scale({scheme: "tableau10"}),

      // Opacity: Fade out non-selected lines
      vl.opacity()
        .condition({param: "genreHighlight", value: 1})
        .value(0.1),

      // Stroke Width: Thicken the hovered line
      vl.strokeWidth()
        .condition({param: "genreHighlight", empty: false, value: 6})
        .value(3),

      // Order: Bring hovered line to front
      vl.order()
        .condition({param: "genreHighlight", value: 1})
        .value(0),

      // Tooltip
      vl.tooltip([
        {field: "Genre", title: "Genre"},
        {field: "Year", title: "Year"},
        {field: "total_sales", format: ".2f", title: "Sales (M)"}
      ])
    )
    .title("Sales Trends: Top 8 Genres (2000-2016)")
   .width("container")
    .height(400)
    .toSpec();


// view5: Grouped Bar Chart: Regional Sales by Platform (Recent 10 Years)
// How do sales distributions across North America, Europe, and Japan differ by platform?

  const regionHighlight = vl.selectPoint('regionHighlight')
    .fields('sales_region')
    .on('pointerover')
    .clear('pointerout')
    .bind('legend');

  const groupedBarHorizontalSpec = vl
    .markBar()
    .data(longData)
    .transform(
      // filter to recent 10 years to focus on current market and reduce clutter
      vl.filter("datum.year >= 2010"), 

      // change sales_region field for better display in legend and tooltip
      {
        calculate: "replace(datum.sales_region, '_', ' ')",
        as: "sales_region"
      },
      // aggregate to get total sales by platform for filtering low-sales platforms
      {
        joinaggregate: [{op: "sum", field: "sales_amount", as: "platform_total"}],
        groupby: ["platform"]
      },
      // filter out platforms with low total sales
      vl.filter("datum.platform_total > 50"), 
      
      {
        aggregate: [{op: "sum", field: "sales_amount", as: "total_sales"}],
        groupby: ["platform", "sales_region", "platform_total"]
      }
    )
    .params(regionHighlight) // add hover interaction for sales region
    .encode(
      // Y axis: Platform, sorted by total sales to keep the biggest platforms at the top
      vl.y().fieldN("platform")
        .sort({field: "platform_total", order: "descending"}) 
        .title("Platform"),
      // X axis: Sales amount
      vl.x().fieldQ("total_sales")
        .title("Sales Amount (Millions)"),

      vl.color().fieldN("sales_region")
        .title("Region")
        .scale({scheme: "category10"}),

      vl.yOffset().fieldN("sales_region"),

      vl.opacity() // Highlight selected region, fade others
        .condition({param: "regionHighlight", value: 1})
        .value(0.1),

      vl.tooltip([
        {field: "platform", title: "Platform"},
        {field: "sales_region", title: "Region"},
        {field: "total_sales", format: ".2f", title: "Sales (M)"}
      ])
    )
    .title("Regional Sales by Platform (Recent 10 Years)")
    .width(680)
    .height(500)
    .toSpec();


  // view 6: Stacked Bar Chart: Sales by Platform and Region
  // Which platforms represent the highest and lowest global sales,
  //  and how does regional market dominance shift between them?

  const vlSpec3 = vl
    .markBar()
    .data(longData) // use long format data for easier region-based encoding and interaction

    // calculate a new field 'sales_region' by replacing underscores with spaces for better display in legend and tooltip
    .transform(
      // replace underscores in sales_region for better display
      {
        calculate: "replace(datum.sales_region, '_', ' ')",
        as: "sales_region"
      },
      
    {
        joinaggregate: [{op: "sum", field: "sales_amount", as: "platform_total"}],
        groupby: ["platform"]
      },

      // filter out platforms with low total sales, greater than 10M 
      vl.filter("datum.platform_total > 10"),

      //aggregate sales by platform and region for the stacked bars
      {
        aggregate: [{op: "sum", field: "sales_amount", as: "total_sales"}],
        groupby: ["platform", "sales_region"]
      }
    )
    .params(
      {
        name: "regionSel",
        select: {
          type: "point",
          fields: ["sales_region"],
          
          on: "pointerover",
          clear: "pointerout"
        },
        bind: "legend"
      }
    )
    .encode(
      // x axis: Platform, sorted by total sales to keep biggest platforms at the top
      vl.x().fieldN("platform").sort("-y").title("Platform"),
      // y axis: Sales amount
      vl.y().fieldQ("total_sales").title("Sales Amount"),
      
      // color: Region
      vl.color().fieldN("sales_region").title("Sales Region"),

      // hover interaction: highlight selected region, fade others
      vl.opacity().condition({param: "regionSel", value: 1}).value(0.3),
      // highlight selected region 
      vl.stroke().condition({param: "regionSel", empty: false}).value(null),
      // bring selected region to front
      vl.order().condition({param: "regionSel", value: 1}).value(0),
      
      
      vl.tooltip([
        vl.fieldN("platform"),
        vl.fieldN("sales_region"),
        {
          field: "total_sales",      // numeric field for tooltip
          type: "quantitative",      // specify type for proper formatting
          format: ".2f",             // format to 2 decimal places
          title: "Total Sales (M)"   // tooltip title
        }      ])
    )
    .title("Sales by Platform and Region ")
    .width(680)
    .height(400)
    .toSpec();

  // View 7: Japan Publisher Battle 
  //publisher in Japan shows the largest sale, and how do competitors perform during market peaks?
const jpPublisherSpec = vl.layer(
// Layer 1: The Bubbles
  vl.markCircle({
    opacity: 0.7,
    stroke: 'white',
    strokeWidth: 1
  })
  .params({
    name: "publisher_focus",
    select: { type: "point", fields: ["Publisher"], on: "pointerover", clear: "pointerout" },
    bind: "legend"
  })
  .encode(
    // Size and Color are specific to the bubble layer
    vl.size().fieldQ("annual_sales")
      .title("Annual Sales (M)")
      .scale({ range: [50, 1200] })
      .legend({ format: "d" }),

    vl.color().fieldN("Publisher")
      .legend(null)
      .scale({ scheme: "category10" }),

    // Interaction Opacity
    vl.opacity().condition({param: "publisher_focus", value: 0.8}).value(0.1)
  ),

  // CHALLENGE!!!: Layer 2: The Text Labels
  vl.markText({
    align: "center",
    baseline: "middle",
    fontSize: 10,
    fontWeight: "bold",
    color: "black" 
  })
  //  Lowered threshold to show text for smaller sales values, making it more informative
  .transform(vl.filter("datum.annual_sales > 5")) 
  .encode(
    // Ensure Text knows where to be X and Y
    vl.x().fieldO("Year"),
    vl.y().fieldN("Publisher"),
    
    // The Text Content
    vl.text().fieldQ("annual_sales").format("d"),

    // Fade text on interaction
    vl.opacity().condition({param: "publisher_focus", value: 1}).value(0.1)
  )
)
// Shared Data and Transformations for both layers
.data(wideData)
.transform(
  vl.filter("datum.Year >= 1995 && datum.Year <= 2016"),
  vl.joinaggregate([
    // calculate total lifetime sales for each publisher across all years, creating a new field 'total_lifetime_sales' used for ranking 
    {op: "sum", field: "JP_Sales", as: "total_lifetime_sales"}
  ]).groupby(["Publisher"]), 

  vl.window([
    {op: "dense_rank", field: "total_lifetime_sales", as: "rank"}
  ]).sort([
    {field: "total_lifetime_sales", order: "descending"}
  ]),
  vl.filter("datum.rank <= 5"),
  vl.aggregate([
    {op: "sum", field: "JP_Sales", as: "annual_sales"}
  ]).groupby(["Year", "Publisher", "total_lifetime_sales"]),
  vl.calculate("trim(replace(datum.Publisher, 'Entertainment', ''))").as("Publisher")
)
.encode(
  // Shared Axis Definitions
  vl.x().fieldO("Year")
    .title("Year")
    .axis({ labelAngle: -45, grid: true }),

  vl.y().fieldN("Publisher")
    .title(null)
    .sort({field: "total_lifetime_sales", order: "descending"}),

  vl.tooltip([
    {field: "Publisher", title: "Publisher"},
    {field: "Year", title: "Year"},
    {field: "annual_sales", format: ".2f", title: "Sales (M)"},
  ])
)
.title("Top 5 Publishers in Japan (Ranked by Total Sales)")
.width(600)
.height(500)
.toSpec();

  
// View 8: Genre Popularity Heatmap by Region 
//Which specific genre dominates sales in the three major global regions?
  const genreRegionSpec = vl
    .markRect({
        cornerRadius: 4
    })
    .data(wideData) 
    .transform(
      // Fold ONLY the 3 major regions 
      vl.fold(["NA_Sales", "EU_Sales", "JP_Sales"]).as("RegionKey", "Sales"),

      // Rename: Create a friendly 'Region' name based on the key
      vl.calculate(
        "datum.RegionKey === 'NA_Sales' ? 'North America' : " +
        "datum.RegionKey === 'EU_Sales' ? 'Europe' : 'Japan'"
      ).as("Region"),
        
      // Aggregate using the 'Region' name
      {
        aggregate: [{op: "sum", field: "Sales", as: "TotalSales"}],
        groupby: ["Genre", "Region"]
      }
    )
    .encode(
      // Y-Axis: Genre
      vl.y().fieldN("Genre")
        .title("Game Genre"),

      // X-Axis: Region (Now uses the clean names)
      vl.x().fieldN("Region")
        .title("Sales Region")
        .axis({labelAngle: 0}), // Keep labels horizontal

      // Color: Sales Volume
      vl.color().fieldQ("TotalSales")
        .title("Sales Amount (M)")
        .scale({scheme: "viridis"}),

      // Tooltip
      vl.tooltip([
        {field: "Genre", title: "Genre"},
        {field: "Region", title: "Region"}, // Shows "North America", etc.
        {field: "TotalSales", format: ".2f", title: "Sales (Millions)"}
      ]) 
    )
    .title("Genre Hotspots: Regional Preferences")
    .width(620) 
    .height(400)
    .toSpec();

  // reder
  render("#view", vlSpec);
  render("#view2", vlSpec2);
    render("#view3", lineSpec);
    render("#view4", top8GenreSpec);
    render("#view5", groupedBarHorizontalSpec);
    render("#view6", vlSpec3);
  render("#view7", jpPublisherSpec);
  render("#view8", genreRegionSpec);
  


  
});


async function render(viewID, spec) {
  const result = await vegaEmbed(viewID, spec);
  result.view.run();
}