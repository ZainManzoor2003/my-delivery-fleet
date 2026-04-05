'use client'
import { useState } from 'react';

const sections = [
    {
        id: 'user-agreement',
        title: 'User Agreement',
        content: (
            <div className="space-y-3">
                <p>This User Agreement (the &quot;Agreement&quot;) is a legally binding contract between My Delivery Fleet LLC (&quot;My Delivery Fleet&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) and the business entity or individual accessing our services (&quot;User&quot;, &quot;Client&quot;, or &quot;you&quot;).</p>
                <p className="italic border-l-4 border-yellow-400 pl-3 bg-yellow-50 py-2 rounded-r text-xs">
                    <span className="font-medium not-italic">Notice to User:</span> This agreement includes important information regarding how we resolve disputes through arbitration, a waiver of your right to participate in class actions, and specific limitations on our financial liability. We encourage you to read these sections carefully before using our services.
                </p>
                <div>
                    <p className="font-medium text-text-2">Description of Service</p>
                    <p className="mt-1">My Delivery Fleet provides a Software-as-a-Service (SaaS) platform that facilitates on-demand delivery fulfillment by connecting Users to third-party delivery providers (collectively &quot;Delivery Partners&quot;), including but not limited to Uber Direct and DoorDash Drive, and provides marketing tools and order-tracking interfaces. My Delivery Fleet provides software connectivity and routing technology only; we are not a delivery company, a motor carrier, a courier, or a transportation provider.</p>
                </div>
            </div>
        ),
    },
    {
        id: 'multi-provider',
        title: 'Multi-Provider Delivery Fulfillment',
        content: (
            <div className="space-y-3">
                <div>
                    <p className="font-medium text-text-2">Third-Party Provider Terms &amp; User Status</p>
                    <p className="mt-1">My Delivery Fleet acts solely as a technical aggregator. We do not transport goods. By requesting a delivery, you agree to be bound by the terms of the specific Delivery Partner assigned to that order.</p>
                    <ul className="list-disc pl-5 space-y-1.5 mt-2">
                        <li><span className="font-medium">Uber Direct:</span> You expressly agree to the Uber Direct Terms and Conditions as may be updated or modified from time to time by Uber (&quot;Uber Direct Terms&quot;). By agreeing to this Agreement, you agree to the Uber Direct Terms and all terms referenced therein.</li>
                        <li><span className="font-medium">User as &quot;Merchant&quot;:</span> You acknowledge that while My Delivery Fleet provides the software API integration, for the purposes of the Uber Direct Terms, you are strictly acting as the &quot;Merchant.&quot; You agree to assume all responsibilities, obligations, warranties, and liabilities imposed on the &quot;Merchant&quot; under the Uber Direct Terms.</li>
                        <li><span className="font-medium">Pass-Through Liability:</span> Any breach of a Delivery Partner&apos;s terms by you is a breach of this Agreement. You shall indemnify My Delivery Fleet for any fines, penalties, or damages imposed by Delivery Partners due to your conduct or the conduct of your customers.</li>
                    </ul>
                </div>
                <div>
                    <p className="font-medium text-text-2">Dispatch Fees and Pricing</p>
                    <p className="mt-1"><span className="font-medium">Dispatch Fees:</span> You will be charged a &quot;Dispatch Fee&quot; consisting of the Delivery Partner&apos;s base fee plus our administrative/processing fees, if applicable. Pricing for delivery services is subject to change at any time based on Delivery Partner rates and our administrative costs.</p>
                    <p className="mt-1"><span className="font-medium">Subscription Fees:</span> My Delivery Fleet reserves the right to implement, modify, or increase recurring subscription fees for access to the platform or specific software suites at any time. We will provide at least thirty (30) days&apos; notice of any change in subscription pricing. Continued use of the platform after the effective date of a price change constitutes your agreement to pay the modified amount.</p>
                </div>
                <div>
                    <p className="font-medium text-text-2">Gratuity Compliance</p>
                    <p className="mt-1">You are responsible for ensuring that tips are distributed in accordance with the policies under which they were collected from your customers. If your ordering system indicates a tip is for the driver, you must ensure that amount is correctly entered into our interface. My Delivery Fleet waives all responsibility for the misallocation or under-reporting of tips by the User.</p>
                </div>
                <div>
                    <p className="font-medium text-text-2">Service Disputes and Resolution</p>
                    <p className="mt-1">The adjudication and issuance of refunds, credits, or financial adjustments resulting from delivery service failures—including but not limited to delayed fulfillment, missing or damaged items, or non-completion of service—are solely governed by the policies and procedures of the applicable Delivery Partner. My Delivery Fleet is not a provider of transportation services and assumes no liability for delivery performance. You acknowledge that any request for reimbursement must be submitted to the Delivery Partner through their designated channels and is subject to their independent investigation and final determination. My Delivery Fleet does not provide direct refunds for delivery-related incidents and possesses no authority to override a Delivery Partner&apos;s claim decision.</p>
                </div>
                <div>
                    <p className="font-medium text-text-2">Delivery Protocol, Discretion, and Transfer of Title</p>
                    <p className="mt-1">You acknowledge that delivery instructions passed to Delivery Partners (such as &quot;Hand to me,&quot; &quot;Meet at door,&quot; or &quot;Knock and wait&quot;) are requests and not guarantees of specific performance. The Delivery Partner and their individual drivers (&quot;Delivery Persons&quot;) reserve the right to complete the delivery in accordance with their safety protocols and operational discretion. In events where a recipient is unavailable, unresponsive, or the delivery location is deemed inaccessible or unsafe, the Delivery Person may, at their sole discretion, complete the delivery by leaving the items at the safest available location (e.g., doorstep, lobby, or front desk). Such delivery shall constitute a completed service for which you remain fully liable for payment.</p>
                    <p className="mt-1"><span className="font-medium">Transfer of Title:</span> You acknowledge that you relinquish title to the items upon completion of pickup by a Delivery Person, at which point title transfers directly to your customer. Neither My Delivery Fleet nor the Delivery Partner takes title to any items at any time, no bailment is created, and neither My Delivery Fleet nor the Delivery Partner acts as a bailee of your goods.</p>
                    <p className="mt-1"><span className="font-medium">Catering and Large Orders:</span> If you submit requests for Catering Orders or unusually large volumes, you acknowledge that acceptance of such requests is at the sole discretion of the Delivery Persons. Delivery Persons are not required to provide any additional equipment (e.g., warming trays) or perform any inside setup or assembly of Catering Orders at the destination.</p>
                </div>
                <div>
                    <p className="font-medium text-text-2">Age-Restricted Items and Alcohol Terms (Strict Compliance)</p>
                    <p className="mt-1">Subject to applicable Laws, you may choose to request the delivery of items subject to age restrictions, including alcohol (&quot;Age-Restricted Items&quot;). By requesting delivery of Age-Restricted Items through the Software, you expressly agree to the following:</p>
                    <ul className="list-disc pl-5 space-y-1.5 mt-2">
                        <li><span className="font-medium">Licensure Warranty:</span> You represent and warrant that you possess all valid licenses, permits, and approvals (&quot;Required Licenses&quot;) required by applicable local, state, and federal laws to sell and deliver Age-Restricted Items. You agree to provide proof of such Required Licenses to us or the Delivery Partner immediately upon request. My Delivery Fleet does not hold a license to sell alcohol and only facilitates connectivity; you are the sole licensed seller and controller of the sale.</li>
                        <li><span className="font-medium">Liability for Prohibited Delivery:</span> You are responsible for taking any steps necessary to inform yourself of applicable laws regarding the sale and delivery of Age-Restricted Items. You agree to limit the hours during which Age-Restricted Items are available for purchase and delivery in accordance with applicable Laws.</li>
                        <li><span className="font-medium">Packaging and Labeling:</span> You will package Age-Restricted Items appropriately for delivery, including any protection necessary to prevent tampering or damage, and any labeling required by Law (including, but not limited to, a statement that the package contains alcohol and may only be delivered to a person 21 years or older with valid proof of age and identity).</li>
                        <li><span className="font-medium">Promotions and Advertising:</span> You agree to follow all Laws and regulations related to your advertisement and promotion of Age-Restricted Items, including Federal Trade Commission guidelines and industry best practices.</li>
                        <li><span className="font-medium">Returns &amp; Return Fees:</span> You acknowledge that a Delivery Person or customer may be required to return an Age-Restricted Item to you if the Delivery Person is unable to deliver it pursuant to applicable Law (e.g., the recipient is underage, intoxicated, or unavailable). Unless prohibited by Law, you agree to accept the return of such items. You explicitly agree that you may be charged a fee for the return (the &quot;Return Fee&quot;), which you authorize My Delivery Fleet to charge to your account. You shall not be paid for returned items.</li>
                        <li>
                            <span className="font-medium">State Specific Provisions:</span> You represent and warrant compliance with all state-specific laws, including but not limited to:
                            <ul className="list-disc pl-5 space-y-1 mt-1">
                                <li><span className="font-medium">Louisiana:</span> If any of your locations are in Louisiana, you acknowledge you will be charged a flat &quot;Alcohol Service Fee&quot; as determined by Uber in place of standard Delivery Charges.</li>
                                <li><span className="font-medium">Washington:</span> Deliveries of Alcohol Items are permitted only between 6:00 a.m. and 2:00 a.m. You must affix a label on the outside of each package stating: (1) the package contains liquor; (2) the recipient must be 21+; and (3) delivery to intoxicated persons is prohibited.</li>
                            </ul>
                        </li>
                    </ul>
                </div>
                <div>
                    <p className="font-medium text-text-2">Prohibited and Substandard Items (Size &amp; Weight Limits)</p>
                    <p className="mt-1">You shall not request delivery for any &quot;Prohibited Items&quot; or unauthorized &quot;Restricted Items&quot; as defined by the Delivery Partner&apos;s terms. You must package all items appropriately (using dry ice, gel packs, sealants, etc.) to prevent tampering, spillage, or damage. If you provide a &quot;Substandard Item&quot; (an item improperly packaged, leaking, unsafe, or non-compliant with food/health codes), you are solely responsible for its disposal. You agree to pay any and all cancellation fees, return fees, or vehicle damage/cleaning fees assessed by the Delivery Partner resulting from your Substandard or Prohibited Items.</p>
                    <p className="mt-1"><span className="font-medium">Size and Weight Restrictions:</span> You agree that all Items provided to a Delivery Person must collectively fit into a standard midsize motor vehicle and must not exceed fifty (50) pounds per package, box, or parcel. If a Delivery Person refuses to accept an Item due to size or weight, you will be solely responsible for any resulting cancellation fees or return fees assessed by the Delivery Partner.</p>
                </div>
                <div>
                    <p className="font-medium text-text-2">Customer Support Responsibility</p>
                    <p className="mt-1">As between you, My Delivery Fleet, and the Delivery Partners, you retain sole responsibility for providing all frontline customer support to your end-customers (the Designated Recipients). This includes resolving any disputes, complaints, or concerns regarding the quality of the goods, missing items, or delivery delays. You agree not to direct your customers to contact My Delivery Fleet or the Delivery Partners directly for order-level support unless specifically authorized by our platform tools.</p>
                </div>
            </div>
        ),
    },
    {
        id: 'data',
        title: 'Data Sourcing, Access, and Commercialization',
        content: (
            <div className="space-y-3">
                <div>
                    <p className="font-medium text-text-2">Sourcing &amp; Verification</p>
                    <p className="mt-1">We source data via Virtual Printers, Email Parsing, and Direct Integrations.</p>
                    <ul className="list-disc pl-5 space-y-1.5 mt-2">
                        <li><span className="font-medium">User Responsibility:</span> You are solely responsible for verifying the accuracy of all order details (address, items, totals, and tips). My Delivery Fleet is not liable for &quot;imperfect data&quot; resulting from automated parsing, OCR errors, or technical glitches.</li>
                        <li><span className="font-medium">Authorization &amp; Customer Consent:</span> You warrant that you have all necessary rights, licenses, and consents to provide us access to this data (including data from POS systems or third-party marketplaces). You specifically represent and warrant that you have obtained legally adequate consent from your customers (&quot;Delivery-Informed Parties&quot;) to share their personal information (name, address, phone number) with My Delivery Fleet and our Delivery Partners for fulfillment, real-time tracking (SMS), and compliance purposes.</li>
                    </ul>
                </div>
                <div>
                    <p className="font-medium text-text-2">Grant of Rights &amp; Data Sale</p>
                    <p className="mt-1">By using the service, you grant My Delivery Fleet a perpetual, irrevocable, worldwide, royalty-free license to collect, process, store, and utilize all data sourced through your account.</p>
                    <ul className="list-disc pl-5 space-y-1.5 mt-2">
                        <li><span className="font-medium">Commercialization:</span> You expressly acknowledge and agree that My Delivery Fleet may sell, lease, license, or otherwise commercialize aggregated or de-identified data, as well as business-level transaction data, to third parties for analytics, marketing, or research purposes, subject to applicable law.</li>
                        <li><span className="font-medium">Indemnity:</span> You shall hold us harmless from any claims by third-party platforms (e.g., GrubHub, DoorDash, POS providers) regarding our scraping, parsing, or commercial use of data sourced from your integrations.</li>
                    </ul>
                </div>
                <div>
                    <p className="font-medium text-text-2">Information Display and Reliance</p>
                    <p className="mt-1">The data presented within the My Delivery Fleet dashboard, including but not limited to driver location, estimated times of arrival (ETA), order status, order content, and inventory availability, is provided for informational purposes only and may reflect cached, delayed, or estimated information. You acknowledge that real-time synchronization is subject to network latency, third-party API limitations, and technical variances. It is the User&apos;s sole responsibility to independently verify critical information before taking action or communicating with end customers. My Delivery Fleet assumes no liability for operational decisions, customer disputes, or financial losses resulting from your reliance on data displayed in our system that may not reflect the immediate real-world status.</p>
                </div>
                <div>
                    <p className="font-medium text-text-2">Auto-Dispatch and Automated Parsing Liability</p>
                    <p className="mt-1">My Delivery Fleet may offer functionality that automatically parses incoming order data and immediately dispatches delivery requests to Delivery Partners without manual review (&quot;Auto-Dispatch&quot;). If you choose to enable Auto-Dispatch, you do so at your own ultimate risk.</p>
                    <ul className="list-disc pl-5 space-y-1.5 mt-2">
                        <li><span className="font-medium">Data Accuracy and Item Flagging:</span> You acknowledge that automated parsing (including OCR, email parsing, or POS scraping) is subject to technical limitations and may occasionally misinterpret item descriptions, quantities, or special instructions.</li>
                        <li><span className="font-medium">Strict Liability for Age-Restricted Items:</span> You are solely and strictly responsible for ensuring that your menu items, POS descriptions, and integrated data feeds clearly and unambiguously identify Age-Restricted Items (e.g., Alcohol). My Delivery Fleet explicitly waives all liability if our software fails to parse, flag, or transmit an item as &quot;Age-Restricted&quot; to the Delivery Partner due to ambiguous, non-standard, or unrecognizable item names provided by your sourcing channels.</li>
                        <li><span className="font-medium">User Duty to Monitor:</span> Even when Auto-Dispatch is enabled, it remains your exclusive responsibility to monitor your dispatch dashboard and ensure that all outbound deliveries containing alcohol or restricted items are properly flagged for mandatory ID verification by the Delivery Person. You shall indemnify and hold My Delivery Fleet harmless against any fines, penalties, or legal action resulting from the delivery of Age-Restricted items that were not properly flagged due to parsing inaccuracies or your failure to monitor auto-dispatched orders.</li>
                    </ul>
                </div>
            </div>
        ),
    },
    {
        id: 'marketing',
        title: 'Marketing Suite, Messaging &amp; Compliance',
        content: (
            <div className="space-y-3">
                <div>
                    <p className="font-medium text-text-2">Comprehensive Message Liability</p>
                    <p className="mt-1">You acknowledge and agree that you are the sole &quot;sender&quot; of all messages (SMS, MMS, or email) transmitted through the My <br /> Delivery Fleet platform, whether such messages are marketing-related, promotional, or transactional in nature (e.g., order updates, delivery tracking). You assume full liability for ensuring that all messaging campaigns, automated triggers, and customer communications comply with: (a) All applicable laws and regulations, including but not limited to the Telephone Consumer <br /> Protection Act (TCPA) and the CTIA Messaging Principles and Best Practices; and (b) The terms of service, privacy policies, and restriction guidelines of the ordering platforms, Point of Sale (POS) systems, or marketplaces from which your customer data is sourced.</p>
                </div>
                <div>
                    <p className="font-medium text-text-2">User Responsibility for Consent and Content</p>
                    <p className="mt-1">My Delivery Fleet provides the technical infrastructure to send messages but exercises no control over the content, recipient list, or timing of your transmissions. It is your exclusive responsibility to confirm that the recipient has provided the necessary consent to receive the specific type of message being sent. You agree to indemnify and hold My Delivery Fleet harmless against any third-party claims, fines, or carrier penalties arising from your failure to adhere to compliance standards or third-party platform rules regarding text messaging.</p>
                </div>
            </div>
        ),
    },
    {
        id: 'payments',
        title: 'Payments, Collections &amp; Pass-Through Billing',
        content: (
            <div className="space-y-2">
                <p>Users are charged on a weekly basis via Stripe based on usage. All pricing is subject to change.</p>
                <ul className="list-disc pl-5 space-y-1.5">
                    <li><span className="font-medium">Credit Card:</span> Subject to processing fees.</li>
                    <li><span className="font-medium">ACH:</span> You authorize My Delivery Fleet to perform balance checks via Stripe Financial Connections to confirm sufficient funding.</li>
                    <li><span className="font-medium">Pass-Through Billing:</span> You acknowledge that My Delivery Fleet facilitates payment for delivery services provided by third parties. You explicitly authorize My Delivery Fleet to automatically charge your stored payment method for all Dispatch Fees, Delivery Charges, driver tips, return fees, cancellation fees, and any other penalties or fees assessed by a Delivery Partner in connection with your account activity.</li>
                    <li><span className="font-medium">Failure to Pay:</span> In the event of non-payment, My Delivery Fleet reserves the right to take legal action to recover funds. You agree to pay a 1.5% monthly late fee and all legal/collection costs. You are solely responsible for any chargebacks or payment disputes initiated by your end customers and must reimburse My Delivery Fleet for any reversed funds.</li>
                </ul>
            </div>
        ),
    },
    {
        id: 'hardware',
        title: 'Hardware and Equipment',
        content: (
            <div className="space-y-2">
                <ul className="list-disc pl-5 space-y-1.5">
                    <li><span className="font-medium">Ownership and Possession:</span> Any hardware provided to the User by My Delivery Fleet, including but not limited to tablets or printers (&quot;Equipment&quot;), remains the sole and exclusive property of My Delivery Fleet. The Equipment is provided to the User on a bailment basis for the sole purpose of accessing the My Delivery Fleet software.</li>
                    <li><span className="font-medium">Mandatory Return Policy:</span> Upon termination of the User&apos;s account for any reason, or if My Delivery Fleet deems the account &quot;Inactive&quot; (defined as thirty consecutive days without a processed delivery), the User must return the Equipment to My Delivery Fleet within seven (7) business days.</li>
                    <li><span className="font-medium">Responsibility for Costs:</span> The User is solely responsible for all costs associated with the return of the Equipment, including professional packaging, insured shipping, and logistics. The User assumes all risk of loss or damage to the Equipment.</li>
                    <li><span className="font-medium">Non-Return Fees:</span> If the Equipment is not received by My Delivery Fleet within the required timeframe, or if the Equipment is returned in a damaged condition (beyond normal wear and tear), the User authorizes My Delivery Fleet to charge the User&apos;s stored payment method for the full MSRP of the Equipment plus a $50.00 administrative processing fee.</li>
                </ul>
            </div>
        ),
    },
    {
        id: 'liability',
        title: 'Liability, Indemnification &amp; Arbitration',
        content: (
            <div className="space-y-3">
                <div>
                    <p className="font-medium text-text-2 uppercase">Zero Liability and Waiver — Total Waiver of Liability</p>
                    <p className="mt-1 uppercase text-xs">TO THE FULLEST EXTENT PERMITTED BY LAW, MY DELIVERY FLEET, ITS OWNERS, AFFILIATES, OFFICERS, AND EMPLOYEES SHALL HAVE NO <br /> LIABILITY WHATSOEVER TO YOU OR ANY THIRD PARTY FOR ANY LOSSES, DAMAGES, OR CLAIMS ARISING OUT OF OR RELATING TO THIS <br /> AGREEMENT OR YOUR USE OF THE SERVICES. THIS INCLUDES, WITHOUT LIMITATION, NO LIABILITY FOR:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-1 uppercase text-xs">
                        <li>LOST PROFITS, LOST REVENUE, OR LOST DATA.</li>
                        <li>MISSED, DELAYED, OR INCORRECT DELIVERIES.</li>
                        <li>ERRORS IN PRICING, TIPPING, OR ADDRESS DATA.</li>
                        <li>THIRD-PARTY DRIVER CONDUCT (THEFT, DAMAGE, MISCONDUCT).</li>
                        <li>SPOILAGE, DAMAGE, OR LOSS OF FOOD OR ALCOHOL PRODUCTS.</li>
                        <li>SERVICE INTERRUPTIONS OR SYSTEM FAILURES.</li>
                    </ul>
                    <p className="mt-2 uppercase text-xs">IF, NOTWITHSTANDING THE TOTAL WAIVER ABOVE, A COURT OF COMPETENT JURISDICTION DETERMINES THAT MY DELIVERY FLEET IS LIABLE TO YOU FOR ANY REASON, YOU AGREE THAT OUR TOTAL AGGREGATE LIABILITY SHALL BE STRICTLY LIMITED TO THE TOTAL ADMINISTRATIVE FEES PAID BY YOU TO US IN THE ONE (1) MONTH PRECEDING THE EVENT GIVING RISE TO THE CLAIM. YOU ACKNOWLEDGE THAT THIS LIMITATION OF LIABILITY IS A FUNDAMENTAL BASIS OF THE BARGAIN AND THAT WE WOULD NOT PROVIDE THE SERVICES TO YOU WITHOUT IT.</p>
                </div>
                <div>
                    <p className="font-medium text-text-2 uppercase">Indemnification and Hold Harmless</p>
                    <p className="mt-1">You shall, at your own expense, indemnify, defend, and hold harmless My Delivery Fleet, its officers, directors, employees, and agents from and against all taxes, losses, liabilities, damages, claims, suits, costs, and expenses (including reasonable attorney&apos;s fees) brought against My Delivery Fleet by a third party (including Uber, DoorDash, or end customers) arising from or in connection with:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                        <li>Your violation or alleged violation of Laws governing food or alcohol safety, or other health and safety Laws;</li>
                        <li>Your violation of the Delivery Partner&apos;s Terms (including Uber Direct Terms) or this Agreement;</li>
                        <li>Your inclusion of a Prohibited Item, Substandard Item, or failure to properly tag, mark, and package Age-Restricted Items;</li>
                        <li>Any personal injury, property damage, or vehicle cleaning fees arising from the Items you requested for delivery;</li>
                        <li>Any failure by you to obtain the legally required consent to share your customers&apos; personal data with My Delivery Fleet or Delivery Partners;</li>
                        <li>Your failure to comply with local laws requiring you to provide restroom facility access to Delivery Persons who are lawfully on your premises to fulfill delivery requests (including, but not limited to, the requirements of Subdivision b of section 20-563.6 of the Administrative Code of the City of New York, if applicable to your location).</li>
                    </ul>
                </div>
                <div>
                    <p className="font-medium text-text-2 uppercase">Arbitration &amp; Class Action Waiver</p>
                    <p className="mt-1">Any dispute arising out of or relating to this Agreement shall be resolved exclusively through binding arbitration on an individual basis. Users waive any right to participate in class actions, collective actions, or representative proceedings.</p>
                </div>
            </div>
        ),
    },
    {
        id: 'general',
        title: 'General Provisions',
        content: (
            <div className="space-y-3">
                <div>
                    <p className="font-medium text-text-2">No Partnership or Agency</p>
                    <p className="mt-1">Nothing in this Agreement creates a partnership, joint venture, employment, or agency relationship between My Delivery Fleet and User.</p>
                </div>
                <div>
                    <p className="font-medium text-text-2">Force Majeure</p>
                    <p className="mt-1">My Delivery Fleet shall not be liable for failure or delay in performance caused by events beyond its reasonable control, including acts of God, natural disasters, labor disputes, internet or power outages, pandemics, government actions, or third-party platform failures.</p>
                </div>
                <div>
                    <p className="font-medium text-text-2">Service Suspension &amp; Termination</p>
                    <p className="mt-1">My Delivery Fleet reserves the right to pause, suspend, or terminate Services at any time, with or without notice, for any reason, including non-payment or suspected misuse. Furthermore, My Delivery Fleet may terminate or suspend your access immediately if your conduct, or the conduct of your employees and staff toward Delivery Persons, creates a safety or reputational risk (&quot;Brand Matter&quot;), violates the Uber Community Guidelines, or if a Delivery Partner restricts your access to their network. You agree that My Delivery Fleet shall have no liability to you for any lost revenue resulting from such suspension.</p>
                </div>
                <div>
                    <p className="font-medium text-text-2">Survival</p>
                    <p className="mt-1">Sections relating to liability limitations, indemnification, arbitration, data rights, payment obligations, and governing law shall survive termination of this Agreement.</p>
                </div>
                <div>
                    <p className="font-medium text-text-2">Entire Agreement</p>
                    <p className="mt-1">This Agreement constitutes the entire agreement between the parties and supersedes all prior agreements or understandings. In the event of a conflict between this Agreement and the Uber Direct Terms regarding physical delivery mechanics or prohibited items, the Uber Direct Terms shall prevail. In the event of a conflict regarding financial liability, software usage, or indemnification between you and My Delivery Fleet, this Agreement shall prevail.</p>
                </div>
            </div>
        ),
    },
    {
        id: 'privacy',
        title: 'Privacy Policy',
        content: (
            <div className="space-y-3">
                <div>
                    <p className="font-medium text-text-2">Information Collection</p>
                    <p className="mt-1">We collect:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                        <li><span className="font-medium">Business Data:</span> Financial info, contact info.</li>
                        <li><span className="font-medium">Transaction Data:</span> Order details, customer names, addresses, phone numbers, and tip amounts sourced from your integrations.</li>
                    </ul>
                </div>
                <div>
                    <p className="font-medium text-text-2">Disclosure and Sale of Data</p>
                    <p className="mt-1">We may sell, license, or share the data we collect (including Personal Information of your customers, where permitted by law) with third parties for commercial purposes.</p>
                    <p className="mt-1"><span className="font-medium">Your Consent:</span> By providing this data or allowing us to source it, you confirm you have the right to share this data with us for these purposes and have provided appropriate notice to your customers in your own privacy policy.</p>
                </div>
                <div>
                    <p className="font-medium text-text-2">Third-Party Partners</p>
                    <p className="mt-1">We share data with Delivery Partners (e.g., Uber Direct, DoorDash Drive) for the purpose of fulfillment, compliance, and real-time delivery tracking; Payment Processors (Stripe); and potential Data Purchasers. Delivery Partners may process personal information to fulfill orders, verify age/identity, and provide delivery status updates.</p>
                </div>
                <div>
                    <p className="font-medium text-text-2">Your Responsibilities</p>
                    <p className="mt-1">You are strictly responsible for maintaining a privacy policy on your own website that discloses to your customers that their data may be shared with third-party service providers (like My Delivery Fleet and its fulfillment partners) and used for delivery, analytics, and marketing purposes.</p>
                </div>
            </div>
        ),
    },
];

export function TermsContent() {
    const [openId, setOpenId] = useState<string>(sections[0].id);

    return (
        <div className="divide-y divide-gray-200 border border-border rounded-lg overflow-hidden">
            {sections.map((section) => {
                const isOpen = openId === section.id;
                return (
                    <div key={section.id}>
                        <button
                            type="button"
                            onClick={() => setOpenId(isOpen ? '' : section.id)}
                            className="w-full flex items-center justify-between px-4 py-3 text-left bg-background hover:bg-background/10 transition-colors cursor-pointer"
                        >
                            <span
                                className="text-sm font-semibold text-gray-800"
                                dangerouslySetInnerHTML={{ __html: section.title }}
                            />
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`h-4 w-4 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                        <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                            <div className="overflow-hidden">
                                <div className="px-4 py-3 text-sm text-gray-600 bg-gray-50 border-t border-border">
                                    {section.content}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
