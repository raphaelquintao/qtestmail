import {Component, ElementRef, ViewChild} from '@angular/core';
import {ActivatedRoute, Router, Routes} from "@angular/router";


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    storage: Storage;

    title = 'QTestmail';

    api_base_url = 'https://api.testmail.app/api/json'

    email_suffix = '@inbox.testmail.app';

    data: any;
    selected: any;

    loading: boolean;

    refresh_ms = 300000;

    time_out : number;

    @ViewChild('email') email!: ElementRef;
    @ViewChild('article') article!: ElementRef;

    constructor(private route: ActivatedRoute, private router: Router) {
        this.storage = window.localStorage;
        this.data = {emails: []};
        this.selected = undefined;
        this.loading = false;
        this.time_out = -1;
    }

    get_storage(key: string, def: any) {
        let tmp = this.storage.getItem(key);
        return tmp ? tmp : def;
    }

    set_storage(key: string, value: any) {
        this.storage.setItem(key, value);
    }

    async get_mails() {
        let url = `${this.api_base_url}?apikey=${this.api_key}&namespace=${this.name_space}&pretty=false`;
        if(this.loading) return;

        this.loading = true;

        let data = await fetch(url, {
            mode: "cors",
        })
            .then(r => {
                if(r.status !== 200) throw new Error();
                this.time_out = setTimeout(() => {
                    console.log('Reloading...', this.time_out);
                    this.get_mails();
                }, this.refresh_ms);
                return r.json();
            })
            .then(r => {
                return r;
            })
            .catch(reason => {
                clearTimeout(this.time_out);
            })
            .finally(() => {
                this.loading = false;
            });


        //@ts-ignore
        this.data = data;
    }

    parse_date(timestamp: any) {
        let date = new Date(timestamp);
        let date_str = date.toLocaleDateString();
        let time_str = date.toLocaleTimeString();
        return `${date_str} - ${time_str}`;
    }

    set email_tag(value: any) {
        this.set_storage('email_tag', value)
    }

    get email_tag() {
        return this.get_storage('email_tag', 'tag')
    }

    set api_key(value: any) {
        this.set_storage('api_key', value)
    }

    get api_key() {
        return this.get_storage('api_key', '')
    }

    set name_space(value: any) {
        this.set_storage('name_space', value)
    }

    get name_space() {
        return this.get_storage('name_space', '')
    }


    set deleted(value: Array<String>) {
        this.set_storage('deleted', value)
    }

    get deleted() {
        let tmp = this.get_storage('deleted', '')
        return tmp.split(',');
    }

    set show_deleted(value: any) {
        this.set_storage('show_deleted', value)
    }

    get show_deleted() {
        return this.get_storage('show_deleted', 'false');
    }

    set tag_selected(value: any) {
        this.set_storage('tag_selected', value)
    }

    get tag_selected() {
        return this.get_storage('tag_selected', '~')
    }

    get tags() {
        let emails = this.data && this.data.emails ? this.data.emails : [];

        let tags: Array<any> = [];

        for (const email of emails) {
            if (!tags.includes(email.tag)) tags.push(email.tag);
        }
        tags.sort();
        tags.unshift('~');

        return tags;
    }

    get emails() {
        let emails = this.data && this.data.emails ? this.data.emails : [];

        let mails = emails.filter((item: any) => {
            if ([item.tag, '~'].includes(this.tag_selected)) {
                if (!this.deleted.includes(item.oid) || this.show_deleted == 'true') {
                    return true;
                }
            }

            return false;
        });

        return mails;
    }

    get attachments() {
        let attachments = this.selected && this.selected.attachments ? this.selected.attachments : [];

        return attachments.filter((item: any) => {
            if (item.contentDisposition !== 'inline') {
                return true;
            }
            return true;
        });
    }

    parse_email_html(email: any) {
        if (!email.html) return '';

        let html = email.html;

        let attachments = email.attachments;

        for (const attachment of attachments) {
            if (attachment.contentDisposition == 'inline') {
                let download_url = attachment.downloadUrl;
                let cid = attachment.cid;
                html = html.replace(`cid:${cid}`, download_url);
            }
        }

        return html;
    }

    delete_handler(event: any, email: any) {
        event.preventDefault();
        event.stopPropagation();
        let tmp = this.deleted;
        tmp.push(email.oid);
        this.deleted = tmp;

        try {
            const index = this.data.emails.indexOf(this.selected);
            if (index > -1) {
                this.card_click_handler(this.emails[index + 1]);
            }
        } catch (e) {
        }
    }

    restore_handler(event: any, email: any) {
        event.preventDefault();
        event.stopPropagation();
        let tmp = this.deleted;
        const index = tmp.indexOf(email.oid);
        if (index > -1) {
            tmp.splice(index, 1);
            this.deleted = tmp;
        }
    }

    show_deleted_handler(event: any) {
        this.show_deleted = event.target.checked;
    }

    select_handler(event: any) {
        this.tag_selected = event.target.value;
    }

    set_name_space(event: any) {
        this.name_space = event.target.value;
        this.get_mails();
    }

    set_api_key(event: any) {
        this.api_key = event.target.value;
        this.get_mails();
    }

    card_click_handler(item: any) {
        this.selected = item;
        if (this.selected) {
            this.article.nativeElement.innerHTML = this.parse_email_html(this.selected);
            this.article.nativeElement.querySelectorAll('a[href]').forEach((el: any) => {
                el.target = '_blank';
            });

            // this.router.navigate([`${this.selected.oid}`])

        } else {
            this.article.nativeElement.innerHTML = '';
        }
    }

    private _copy(text: any) {
        let textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            let successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        } catch (err) {
            return false;
        }

    }

    async copy_handle(event: any) {
        let el = this.email.nativeElement;
        let text = el.innerText;

        this._copy(text.replace(/(\n|\s)+/g, ''));
        event.target.innerText = "copied";

        setTimeout(function () {
            event.target.innerText = "copy";
        }, 700);

    }

    set_value_handle(event: any, control: any) {
        if (control === 'email_tag') {
            if(['Enter'].includes(event.key)) {
                event.preventDefault();
                event.target.blur();
                // return;
            }
            console.log(control, event.key, event.target.innerText);
            this.set_storage('email_tag', event.target.innerText)
        } else if (control === 'api_key') {
            if(event.key == 'Enter') this.get_mails();
            // console.log(control, event.key);
            this.api_key = event.target.value;
        } else if (control === 'namespace') {
            if(event.key == 'Enter') this.get_mails();
            // console.log(control, event.key);
            this.name_space = event.target.value;
        }
    }

    ngOnInit(): void {
        this.get_mails();
        // this.route.paramMap.subscribe(params => {
        //    let tmp = params.get('oid');
        //    console.log(tmp);
        // });

    }

    ngAfterViewInit(): void {

    }

}
