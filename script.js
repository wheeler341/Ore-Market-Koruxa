// =====================================================
// KORUXA ORE & GEM MARKET
//
// RULES:
// - 1 Gem requires 6 matching Ore
// - Missing Ore is automatically added
// - Maximum 75,000 of EACH Ore type per order
// =====================================================

const ORE_PER_GEM = 6;

const MAX_ORE_PER_MATERIAL = 75000;

const MAX_GEMS_PER_MATERIAL =
  Math.floor(
    MAX_ORE_PER_MATERIAL /
    ORE_PER_GEM
  );


// =====================================================
// CLOUDFLARE WORKER
//
// Paste your Cloudflare Worker URL here.
//
// Example:
// const ORDER_ENDPOINT =
//   "https://koruxa-orders.yourname.workers.dev";
// =====================================================

const ORDER_ENDPOINT = "";


// =====================================================
// MARKET DATA
// =====================================================

const MATERIALS = [

  {
    name: "Dustite",
    orePrice: 1000,
    gemName: "Opal",
    gemPrice: 25000
  },

  {
    name: "Void Rift",
    orePrice: 350,
    gemName: null,
    gemPrice: null
  },

  {
    name: "Gold",
    orePrice: 1500,
    gemName: null,
    gemPrice: null
  },

  {
    name: "Copite",
    orePrice: 550,
    gemName: "Amber",
    gemPrice: 27000
  },

  {
    name: "Velorite",
    orePrice: 650,
    gemName: "Aquastone",
    gemPrice: 29000
  },

  {
    name: "Crimsite",
    orePrice: 750,
    gemName: "Garnet",
    gemPrice: 31500
  },

  {
    name: "Shalore",
    orePrice: 850,
    gemName: "Frostgem",
    gemPrice: 33500
  },

  {
    name: "Noctite",
    orePrice: 950,
    gemName: "Voidopal",
    gemPrice: 35500
  },

  {
    name: "Auorite",
    orePrice: 1050,
    gemName: "Sunstone",
    gemPrice: 37500
  },

  {
    name: "Vexite",
    orePrice: 1150,
    gemName: "Duskgem",
    gemPrice: 39500
  },

  {
    name: "Zephyne",
    orePrice: 1250,
    gemName: "Stormheart",
    gemPrice: 41500
  },

  {
    name: "Korunite",
    orePrice: 1350,
    gemName: "Astralite",
    gemPrice: 44000
  },

  {
    name: "Drakonite",
    orePrice: 1450,
    gemName: "Emberstone",
    gemPrice: 46000
  },

  {
    name: "Potent Void Rift",
    orePrice: 350,
    gemName: null,
    gemPrice: null
  },

  {
    name: "Pyrethium",
    orePrice: 1550,
    gemName: "Magmaheart",
    gemPrice: 48000
  },

  {
    name: "Infernite",
    orePrice: 1650,
    gemName: "Pyreshard",
    gemPrice: 50000
  }

];


// =====================================================
// STATE
//
// manualOre = Ore the buyer personally selected
//
// gems = Gems the buyer selected
//
// Displayed Ore becomes:
//
// MAX(
//   manualOre,
//   gems × 6
// )
//
// Example:
//
// 4 Dustite Ore
// + 1 Opal
//
// = 6 Dustite Ore
//   1 Opal
//
// Only 2 Ore were automatically added.
// =====================================================

const state = {

  cart: {},

  search: ""

};


// =====================================================
// ELEMENTS
// =====================================================

const materialList =
  document.querySelector(
    "#materialList"
  );

const materialTemplate =
  document.querySelector(
    "#materialTemplate"
  );

const searchInput =
  document.querySelector(
    "#search"
  );

const cartItems =
  document.querySelector(
    "#cartItems"
  );

const grandTotal =
  document.querySelector(
    "#grandTotal"
  );

const cartCount =
  document.querySelector(
    "#cartCount"
  );

const topBasketCount =
  document.querySelector(
    "#topBasketCount"
  );

const validationMessage =
  document.querySelector(
    "#validationMessage"
  );

const customerName =
  document.querySelector(
    "#customerName"
  );

const orderNotes =
  document.querySelector(
    "#orderNotes"
  );

const submitOrderButton =
  document.querySelector(
    "#submitOrder"
  );

const submitStatus =
  document.querySelector(
    "#submitStatus"
  );

const clearOrderButton =
  document.querySelector(
    "#clearOrder"
  );


// =====================================================
// GP FORMAT
// =====================================================

function gp(value) {

  return (
    Number(value).toLocaleString() +
    " GP"
  );

}


// =====================================================
// MATERIAL LOOKUP
// =====================================================

function getMaterial(name) {

  return MATERIALS.find(
    material =>
      material.name === name
  );

}


// =====================================================
// CART ENTRY
// =====================================================

function getEntry(materialName) {

  if (!state.cart[materialName]) {

    state.cart[materialName] = {

      manualOre: 0,

      gems: 0

    };

  }

  return state.cart[
    materialName
  ];

}


// =====================================================
// REQUIRED ORE
// =====================================================

function getRequiredOre(materialName) {

  const entry =
    getEntry(
      materialName
    );

  return (
    entry.gems *
    ORE_PER_GEM
  );

}


// =====================================================
// EFFECTIVE ORE
//
// The basket displays whichever is larger:
//
// Ore manually ordered
//
// OR
//
// Ore required by Gems
// =====================================================

function getEffectiveOre(materialName) {

  const entry =
    getEntry(
      materialName
    );

  const requiredOre =
    getRequiredOre(
      materialName
    );

  return Math.max(

    entry.manualOre,

    requiredOre

  );

}


// =====================================================
// AUTOMATIC ORE
// =====================================================

function getAutomaticOre(materialName) {

  const entry =
    getEntry(
      materialName
    );

  const effectiveOre =
    getEffectiveOre(
      materialName
    );

  return Math.max(

    0,

    effectiveOre -
    entry.manualOre

  );

}


// =====================================================
// NORMALIZE CART
//
// Makes sure old saved data can never exceed:
// 75,000 Ore
// 12,500 Gems
// =====================================================

function normalizeCart() {

  Object.keys(
    state.cart
  ).forEach(name => {

    const entry =
      state.cart[name];


    if (
      !entry ||
      typeof entry !== "object"
    ) {

      delete state.cart[name];

      return;

    }


    entry.manualOre =
      Number(
        entry.manualOre
      ) || 0;


    entry.gems =
      Number(
        entry.gems
      ) || 0;


    entry.manualOre =
      Math.floor(
        Math.max(
          0,
          Math.min(
            entry.manualOre,
            MAX_ORE_PER_MATERIAL
          )
        )
      );


    entry.gems =
      Math.floor(
        Math.max(
          0,
          Math.min(
            entry.gems,
            MAX_GEMS_PER_MATERIAL
          )
        )
      );


    if (
      entry.manualOre <= 0 &&
      entry.gems <= 0
    ) {

      delete state.cart[name];

    }

  });

}


// =====================================================
// CLEANUP
// =====================================================

function cleanupCart() {

  normalizeCart();


  Object.keys(
    state.cart
  ).forEach(name => {

    const entry =
      state.cart[name];


    if (
      entry.manualOre <= 0 &&
      entry.gems <= 0
    ) {

      delete state.cart[name];

    }

  });

}


// =====================================================
// SAVE CART
// =====================================================

function saveCart() {

  cleanupCart();


  localStorage.setItem(

    "koruxaMarketCart",

    JSON.stringify(
      state.cart
    )

  );

}


// =====================================================
// ITEM COUNT
// =====================================================

function getTotalItemCount() {

  let total = 0;


  Object.keys(
    state.cart
  ).forEach(name => {

    const entry =
      state.cart[name];


    total +=
      getEffectiveOre(
        name
      );


    total +=
      entry.gems;

  });


  return total;

}


// =====================================================
// GRAND TOTAL
// =====================================================

function calculateGrandTotal() {

  let total = 0;


  Object.keys(
    state.cart
  ).forEach(name => {

    const material =
      getMaterial(
        name
      );


    if (!material) {
      return;
    }


    const entry =
      state.cart[name];


    const oreQty =
      getEffectiveOre(
        name
      );


    total +=

      oreQty *

      material.orePrice;


    if (
      entry.gems > 0 &&
      material.gemPrice != null
    ) {

      total +=

        entry.gems *

        material.gemPrice;

    }

  });


  return total;

}


// =====================================================
// RENDER MARKET
// =====================================================

function renderMaterials() {

  materialList.innerHTML =
    "";


  const query =
    state.search
      .trim()
      .toLowerCase();


  const materials =
    MATERIALS.filter(
      material => {

        const searchable =
          [
            material.name,
            material.gemName || ""
          ]
            .join(" ")
            .toLowerCase();


        return searchable.includes(
          query
        );

      }
    );


  if (
    !materials.length
  ) {

    materialList.innerHTML = `

      <div class="no-results">

        No matching materials found.

      </div>

    `;

    return;

  }


  materials.forEach(
    material => {

      const fragment =
        materialTemplate
          .content
          .cloneNode(
            true
          );


      const card =
        fragment.querySelector(
          ".material-card"
        );

      const visualIcon =
        fragment.querySelector(
          ".visual-icon"
        );

      const category =
        fragment.querySelector(
          ".material-category"
        );

      const title =
        fragment.querySelector(
          "h3"
        );

      const secondary =
        fragment.querySelector(
          ".material-secondary"
        );

      const oreButton =
        fragment.querySelector(
          ".ore-button"
        );

      const gemButton =
        fragment.querySelector(
          ".gem-button"
        );

      const gemButtonName =
        fragment.querySelector(
          ".gem-button-name"
        );

      const unitPriceElement =
        fragment.querySelector(
          ".unit-price"
        );

      const requirementInfo =
        fragment.querySelector(
          ".requirement-info"
        );

      const qtyInput =
        fragment.querySelector(
          ".qty-input"
        );

      const lineTotal =
        fragment.querySelector(
          ".line-total"
        );

      const addButton =
        fragment.querySelector(
          ".add-button"
        );


      let selectedType =
        "ore";


      // =================================================
      // GEM BUTTON NAME
      // =================================================

      if (
        material.gemName
      ) {

        gemButtonName.textContent =
          material.gemName;

      }

      else {

        gemButtonName.textContent =
          "No Gem";


        gemButton.disabled =
          true;

      }


      // =================================================
      // UPDATE CARD DISPLAY
      // =================================================

      function updateTypeDisplay() {

        card.classList.toggle(

          "gem-selected",

          selectedType ===
            "gem"

        );


        // ---------------------------------------------
        // ORE
        // ---------------------------------------------

        if (
          selectedType ===
          "ore"
        ) {

          visualIcon.textContent =
            "⛏️";


          category.textContent =
            "ORE";


          title.textContent =
            material.name;


          secondary.textContent =
            material.gemName

              ? `Matching gem: ${material.gemName}`

              : "Ore only";


          unitPriceElement.textContent =
            gp(
              material.orePrice
            );


          const currentOre =
            getEffectiveOre(
              material.name
            );


          requirementInfo.innerHTML = `

            ${currentOre.toLocaleString()}
            /
            ${MAX_ORE_PER_MATERIAL.toLocaleString()}

            <br>

            Ore in basket

          `;

        }


        // ---------------------------------------------
        // GEM
        // ---------------------------------------------

        if (
          selectedType ===
          "gem"
        ) {

          visualIcon.textContent =
            "💎";


          category.textContent =
            "UNCUT GEM";


          title.textContent =
            material.gemName;


          secondary.textContent =
            `Matched with ${material.name} Ore`;


          unitPriceElement.textContent =
            gp(
              material.gemPrice
            );


          const entry =
            getEntry(
              material.name
            );


          const currentOre =
            getEffectiveOre(
              material.name
            );


          requirementInfo.innerHTML = `

            <strong>
              ${ORE_PER_GEM} Ore / Gem
            </strong>

            <br>

            ${currentOre.toLocaleString()}
            /
            ${MAX_ORE_PER_MATERIAL.toLocaleString()}
            Ore

            <br>

            Max ${MAX_GEMS_PER_MATERIAL.toLocaleString()}
            Gems

          `;

        }


        oreButton.classList.toggle(

          "active",

          selectedType ===
            "ore"

        );


        gemButton.classList.toggle(

          "active",

          selectedType ===
            "gem"

        );


        updateLineTotal();

      }


      // =================================================
      // LINE TOTAL
      // =================================================

      function updateLineTotal() {

        let quantity =
          parseInt(
            qtyInput.value,
            10
          );


        if (
          !Number.isFinite(
            quantity
          ) ||
          quantity < 1
        ) {

          quantity = 1;

        }


        qtyInput.value =
          String(
            quantity
          );


        const price =

          selectedType ===
            "ore"

            ? material.orePrice

            : material.gemPrice;


        lineTotal.textContent =
          gp(
            price *
            quantity
          );

      }


      // =================================================
      // ORE BUTTON
      // =================================================

      oreButton.addEventListener(

        "click",

        () => {

          selectedType =
            "ore";


          updateTypeDisplay();

        }

      );


      // =================================================
      // GEM BUTTON
      // =================================================

      gemButton.addEventListener(

        "click",

        () => {

          if (
            !material.gemName ||
            material.gemPrice ==
              null
          ) {

            return;

          }


          selectedType =
            "gem";


          updateTypeDisplay();

        }

      );


      // =================================================
      // QUANTITY
      // =================================================

      qtyInput.addEventListener(

        "input",

        updateLineTotal

      );


      // =================================================
      // ADD BUTTON
      // =================================================

      addButton.addEventListener(

        "click",

        () => {

          let quantity =
            parseInt(
              qtyInput.value,
              10
            );


          if (
            !Number.isFinite(
              quantity
            ) ||
            quantity < 1
          ) {

            quantity = 1;

          }


          const entry =
            getEntry(
              material.name
            );


          // =============================================
          // ADD ORE
          // =============================================

          if (
            selectedType ===
            "ore"
          ) {

            const currentOre =
              getEffectiveOre(
                material.name
              );


            const remaining =
              MAX_ORE_PER_MATERIAL -
              currentOre;


            if (
              remaining <= 0
            ) {

              alert(

                `You can only order a maximum of ${MAX_ORE_PER_MATERIAL.toLocaleString()} ${material.name} Ore.`

              );

              return;

            }


            quantity =
              Math.min(
                quantity,
                remaining
              );


            /*
              If Gems are already creating
              automatic Ore, preserve the
              currently displayed amount.

              Example:

              1 Gem created 6 automatic Ore.

              They then add 10 Ore manually.

              Result becomes 16 Ore total,
              because they intentionally
              added 10 more.
            */

            entry.manualOre =

              Math.max(

                entry.manualOre,

                currentOre

              ) +

              quantity;


            entry.manualOre =
              Math.min(

                entry.manualOre,

                MAX_ORE_PER_MATERIAL

              );

          }


          // =============================================
          // ADD GEM
          // =============================================

          if (
            selectedType ===
            "gem"
          ) {

            if (
              entry.gems >=
              MAX_GEMS_PER_MATERIAL
            ) {

              alert(

                `You have reached the maximum of ${MAX_GEMS_PER_MATERIAL.toLocaleString()} ${material.gemName}.`

              );

              return;

            }


            const remainingGems =

              MAX_GEMS_PER_MATERIAL -

              entry.gems;


            quantity =
              Math.min(

                quantity,

                remainingGems

              );


            const newGemTotal =

              entry.gems +

              quantity;


            const requiredOre =

              newGemTotal *

              ORE_PER_GEM;


            const finalOre =

              Math.max(

                entry.manualOre,

                requiredOre

              );


            if (
              finalOre >
              MAX_ORE_PER_MATERIAL
            ) {

              alert(

                `This order would require more than ${MAX_ORE_PER_MATERIAL.toLocaleString()} ${material.name} Ore.`

              );

              return;

            }


            entry.gems =
              newGemTotal;

          }


          cleanupCart();

          saveCart();

          renderCart();

          renderMaterials();

        }

      );


      updateTypeDisplay();


      materialList.appendChild(
        fragment
      );

    }
  );

}


// =====================================================
// CREATE BASKET ROW
// =====================================================

function createCartRow({

  icon,

  name,

  metadata,

  note,

  quantity,

  price,

  onMinus,

  onPlus,

  onRemove

}) {

  const row =
    document.createElement(
      "div"
    );


  row.className =
    "cart-row";


  row.innerHTML = `

    <div class="cart-icon">
      ${icon}
    </div>


    <div>

      <div class="cart-name">
        ${name}
      </div>

      <div class="cart-meta">
        ${metadata}
      </div>

      ${
        note

          ? `

            <div class="auto-ore-note">
              ${note}
            </div>

          `

          : ""
      }

    </div>


    <div class="cart-right">

      <div class="cart-price">
        ${price}
      </div>


      <div class="cart-controls">

        <button
          type="button"
          class="
            cart-control-button
            minus
          "
        >
          −
        </button>


        <span class="cart-qty">
          ${quantity}
        </span>


        <button
          type="button"
          class="
            cart-control-button
            plus
          "
        >
          +
        </button>


        <button
          type="button"
          class="
            cart-control-button
            remove-cart-button
            remove
          "
          title="Remove"
        >
          ×
        </button>

      </div>

    </div>

  `;


  row
    .querySelector(
      ".minus"
    )
    .addEventListener(

      "click",

      onMinus

    );


  row
    .querySelector(
      ".plus"
    )
    .addEventListener(

      "click",

      onPlus

    );


  row
    .querySelector(
      ".remove"
    )
    .addEventListener(

      "click",

      onRemove

    );


  return row;

}


// =====================================================
// RENDER BASKET
// =====================================================

function renderCart() {

  cleanupCart();


  cartItems.innerHTML =
    "";


  const materialNames =
    Object.keys(
      state.cart
    );


  // =================================================
  // EMPTY BASKET
  // =================================================

  if (
    !materialNames.length
  ) {

    cartItems.innerHTML = `

      <div class="empty-basket">

        <div class="empty-icon">
          🛒
        </div>

        <strong>
          Your basket is empty
        </strong>

        <span>
          Add some Ore or Gems above.
        </span>

      </div>

    `;

  }


  // =================================================
  // MATERIALS
  // =================================================

  materialNames.forEach(
    materialName => {

      const material =
        getMaterial(
          materialName
        );


      if (!material) {
        return;
      }


      const entry =
        getEntry(
          materialName
        );


      const oreQty =
        getEffectiveOre(
          materialName
        );


      const autoOre =
        getAutomaticOre(
          materialName
        );


      // =================================================
      // ORE ROW
      // =================================================

      if (
        oreQty > 0
      ) {

        let note = "";


        if (
          autoOre > 0
        ) {

          note =

            `${autoOre.toLocaleString()} Ore automatically added for your Gem order`;

        }


        if (
          oreQty >=
          MAX_ORE_PER_MATERIAL
        ) {

          note +=

            `${
              note
                ? " • "
                : ""
            }75,000 Ore maximum reached`;

        }


        const oreRow =
          createCartRow({

            icon:
              "⛏️",


            name:
              `${material.name} Ore`,


            metadata:

              `${oreQty.toLocaleString()} × ${gp(material.orePrice)}`,


            note,


            quantity:
              oreQty.toLocaleString(),


            price:

              gp(

                oreQty *

                material.orePrice

              ),


            // ===========================================
            // MINUS ORE
            // ===========================================

            onMinus() {

              if (
                entry.manualOre > 0
              ) {

                entry.manualOre--;

              }


              cleanupCart();

              saveCart();

              renderCart();

              renderMaterials();

            },


            // ===========================================
            // PLUS ORE
            // ===========================================

            onPlus() {

              const currentOre =
                getEffectiveOre(
                  materialName
                );


              if (
                currentOre >=
                MAX_ORE_PER_MATERIAL
              ) {

                alert(

                  `Maximum ${MAX_ORE_PER_MATERIAL.toLocaleString()} ${materialName} Ore per order.`

                );

                return;

              }


              entry.manualOre =

                Math.max(

                  entry.manualOre,

                  currentOre

                ) +

                1;


              entry.manualOre =
                Math.min(

                  entry.manualOre,

                  MAX_ORE_PER_MATERIAL

                );


              saveCart();

              renderCart();

              renderMaterials();

            },


            // ===========================================
            // REMOVE ORE
            //
            // If Gems still need Ore,
            // required Ore remains.
            // ===========================================

            onRemove() {

              entry.manualOre =
                0;


              cleanupCart();

              saveCart();

              renderCart();

              renderMaterials();

            }

          });


        cartItems.appendChild(
          oreRow
        );

      }


      // =================================================
      // GEM ROW
      // =================================================

      if (
        entry.gems > 0 &&
        material.gemName
      ) {

        const gemRow =
          createCartRow({

            icon:
              "💎",


            name:

              `${material.gemName} (Uncut Gem)`,


            metadata:

              `${entry.gems.toLocaleString()} × ${gp(material.gemPrice)}`,


            note:

              `Requires ${(entry.gems * ORE_PER_GEM).toLocaleString()} ${material.name} Ore`,


            quantity:
              entry.gems.toLocaleString(),


            price:

              gp(

                entry.gems *

                material.gemPrice

              ),


            // ===========================================
            // MINUS GEM
            // ===========================================

            onMinus() {

              entry.gems =
                Math.max(

                  0,

                  entry.gems - 1

                );


              cleanupCart();

              saveCart();

              renderCart();

              renderMaterials();

            },


            // ===========================================
            // PLUS GEM
            // ===========================================

            onPlus() {

              const newGemQuantity =
                entry.gems + 1;


              const requiredOre =

                newGemQuantity *

                ORE_PER_GEM;


              const finalOre =

                Math.max(

                  entry.manualOre,

                  requiredOre

                );


              if (
                finalOre >
                MAX_ORE_PER_MATERIAL
              ) {

                alert(

                  `You cannot add another ${material.gemName}. The order is limited to ${MAX_ORE_PER_MATERIAL.toLocaleString()} ${materialName} Ore.`

                );

                return;

              }


              entry.gems++;


              saveCart();

              renderCart();

              renderMaterials();

            },


            // ===========================================
            // REMOVE GEM
            //
            // Automatic Ore disappears if it
            // is no longer required.
            //
            // Manually ordered Ore remains.
            // ===========================================

            onRemove() {

              entry.gems =
                0;


              cleanupCart();

              saveCart();

              renderCart();

              renderMaterials();

            }

          });


        cartItems.appendChild(
          gemRow
        );

      }

    }
  );


  // =================================================
  // COUNTS
  // =================================================

  const totalItems =
    getTotalItemCount();


  cartCount.textContent =
    totalItems.toLocaleString();


  topBasketCount.textContent =
    totalItems.toLocaleString();


  // =================================================
  // TOTAL
  // =================================================

  grandTotal.textContent =
    gp(
      calculateGrandTotal()
    );


  // =================================================
  // AUTO ORE MESSAGE
  // =================================================

  const totalAutoOre =

    Object.keys(
      state.cart
    )

      .reduce(

        (
          sum,
          name
        ) => {

          return (

            sum +

            getAutomaticOre(
              name
            )

          );

        },

        0

      );


  if (
    totalAutoOre > 0
  ) {

    validationMessage.textContent =

      `✓ ${totalAutoOre.toLocaleString()} required Ore automatically included for Gem purchases.`;

  }

  else {

    validationMessage.textContent =
      "";

  }

}


// =====================================================
// BUILD ORDER
// =====================================================

function buildOrder() {

  const items = [];


  Object.keys(
    state.cart
  ).forEach(
    materialName => {

      const material =
        getMaterial(
          materialName
        );


      if (!material) {
        return;
      }


      const entry =
        getEntry(
          materialName
        );


      const oreQty =
        getEffectiveOre(
          materialName
        );


      // =================================================
      // ORE
      // =================================================

      if (
        oreQty > 0
      ) {

        items.push({

          material:
            materialName,

          itemName:
            `${materialName} Ore`,

          type:
            "ore",

          quantity:
            oreQty,

          unitPrice:
            material.orePrice,

          total:

            oreQty *

            material.orePrice,

          automaticOre:

            getAutomaticOre(
              materialName
            )

        });

      }


      // =================================================
      // GEM
      // =================================================

      if (
        entry.gems > 0 &&
        material.gemName
      ) {

        items.push({

          material:
            materialName,

          itemName:
            material.gemName,

          type:
            "gem",

          quantity:
            entry.gems,

          unitPrice:
            material.gemPrice,

          total:

            entry.gems *

            material.gemPrice

        });

      }

    }
  );


  return {

    customerName:

      customerName
        .value
        .trim(),


    notes:

      orderNotes
        .value
        .trim(),


    items,


    total:

      calculateGrandTotal(),


    submittedAt:

      new Date()
        .toISOString()

  };

}


// =====================================================
// SEARCH
// =====================================================

searchInput.addEventListener(

  "input",

  event => {

    state.search =
      event.target.value;


    renderMaterials();

  }

);


// =====================================================
// SAVE CUSTOMER NAME
// =====================================================

customerName.addEventListener(

  "input",

  () => {

    localStorage.setItem(

      "koruxaCustomerName",

      customerName.value

    );

  }

);


// =====================================================
// SAVE NOTES
// =====================================================

orderNotes.addEventListener(

  "input",

  () => {

    localStorage.setItem(

      "koruxaOrderNotes",

      orderNotes.value

    );

  }

);


// =====================================================
// CLEAR BASKET
// =====================================================

clearOrderButton.addEventListener(

  "click",

  () => {

    if (
      !Object.keys(
        state.cart
      ).length
    ) {

      return;

    }


    const confirmed =
      confirm(
        "Clear your entire basket?"
      );


    if (!confirmed) {
      return;
    }


    state.cart = {};


    saveCart();

    renderCart();

    renderMaterials();


    submitStatus.textContent =
      "";

  }

);


// =====================================================
// SUBMIT ORDER
// =====================================================

submitOrderButton.addEventListener(

  "click",

  async () => {

    submitStatus.className =
      "submit-status";


    submitStatus.textContent =
      "";


    cleanupCart();


    // =================================================
    // EMPTY
    // =================================================

    if (
      !Object.keys(
        state.cart
      ).length
    ) {

      submitStatus.className =
        "submit-status error";


      submitStatus.textContent =
        "Your basket is empty.";


      return;

    }


    // =================================================
    // CUSTOMER NAME
    // =================================================

    if (
      !customerName
        .value
        .trim()
    ) {

      submitStatus.className =
        "submit-status error";


      submitStatus.textContent =
        "Please enter your Discord or game name.";


      customerName.focus();


      return;

    }


    // =================================================
    // FINAL 75K SAFETY CHECK
    // =================================================

    for (
      const materialName
      of Object.keys(
        state.cart
      )
    ) {

      const oreQty =
        getEffectiveOre(
          materialName
        );


      if (
        oreQty >
        MAX_ORE_PER_MATERIAL
      ) {

        submitStatus.className =
          "submit-status error";


        submitStatus.textContent =

          `${materialName} exceeds the ${MAX_ORE_PER_MATERIAL.toLocaleString()} Ore limit.`;


        return;

      }

    }


    // =================================================
    // WORKER NOT CONFIGURED
    // =================================================

    if (
      !ORDER_ENDPOINT
    ) {

      submitStatus.className =
        "submit-status error";


      submitStatus.textContent =

        "Your market is ready, but the Cloudflare Worker URL still needs to be added to script.js.";


      return;

    }


    const order =
      buildOrder();


    // =================================================
    // LOADING
    // =================================================

    submitOrderButton.disabled =
      true;


    const submitText =

      submitOrderButton
        .querySelector(
          "span:first-child"
        );


    if (
      submitText
    ) {

      submitText.textContent =
        "Submitting...";

    }


    // =================================================
    // SEND
    // =================================================

    try {

      const response =
        await fetch(

          ORDER_ENDPOINT,

          {

            method:
              "POST",

            headers: {

              "Content-Type":
                "application/json"

            },

            body:

              JSON.stringify(
                order
              )

          }

        );


      const result =
        await response
          .json()
          .catch(
            () => ({})
          );


      if (
        !response.ok
      ) {

        throw new Error(

          result.error ||

          "Order submission failed."

        );

      }


      // =================================================
      // SUCCESS
      // =================================================

      submitStatus.className =
        "submit-status success";


      submitStatus.textContent =
        "✓ Your order was submitted successfully!";


      state.cart = {};


      orderNotes.value =
        "";


      localStorage.removeItem(
        "koruxaOrderNotes"
      );


      saveCart();

      renderCart();

      renderMaterials();


      if (
        submitText
      ) {

        submitText.textContent =
          "Order Submitted ✓";

      }


      setTimeout(

        () => {

          if (
            submitText
          ) {

            submitText.textContent =
              "Submit Order";

          }

        },

        2500

      );

    }


    // =================================================
    // ERROR
    // =================================================

    catch (error) {

      console.error(
        error
      );


      submitStatus.className =
        "submit-status error";


      submitStatus.textContent =

        error.message ||

        "Unable to submit the order.";


      if (
        submitText
      ) {

        submitText.textContent =
          "Submit Order";

      }

    }


    // =================================================
    // FINISH
    // =================================================

    finally {

      submitOrderButton.disabled =
        false;

    }

  }

);


// =====================================================
// LOAD SAVED CART
// =====================================================

try {

  const storedCart =
    JSON.parse(

      localStorage.getItem(
        "koruxaMarketCart"
      ) ||

      "{}"

    );


  if (
    storedCart &&
    typeof storedCart ===
      "object" &&
    !Array.isArray(
      storedCart
    )
  ) {

    state.cart =
      storedCart;

  }

}

catch {

  state.cart = {};

}


// =====================================================
// LOAD SAVED CUSTOMER NAME
// =====================================================

customerName.value =

  localStorage.getItem(
    "koruxaCustomerName"
  ) || "";


// =====================================================
// LOAD SAVED NOTES
// =====================================================

orderNotes.value =

  localStorage.getItem(
    "koruxaOrderNotes"
  ) || "";


// =====================================================
// START
// =====================================================

normalizeCart();

cleanupCart();

saveCart();

renderMaterials();

renderCart();
